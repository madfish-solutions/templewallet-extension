import { useCallback, useEffect, useMemo } from 'react';

import { emptyFn } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';
import memoizee from 'memoizee';
import { useDispatch } from 'react-redux';
import type { AnyAction } from 'redux';
import useSWR from 'swr';

import { subscribeToActions } from 'app/store';
import { loadAssetsBalancesActions, loadGasBalanceActions, putTokensBalancesAction } from 'app/store/balances/actions';
import {
  useAllAccountBalancesSelector,
  useBalancesErrorSelector,
  useBalanceSelector,
  useBalancesLoadingSelector,
  useTriedToLoadGasBalanceSelector,
  useTriedToLoadAssetsBalancesSelector,
  useAllBalancesSelector
} from 'app/store/balances/selectors';
import { getKeyForBalancesRecord } from 'app/store/balances/utils';
import {
  addWhitelistTokensMetadataAction,
  putTokensMetadataAction,
  resetTokensMetadataLoadingAction
} from 'app/store/tokens-metadata/actions';
import { isKnownChainId } from 'lib/apis/tzkt';
import { toTokenSlug, TEZ_TOKEN_SLUG } from 'lib/assets';
import { BLOCK_DURATION } from 'lib/fixed-times';
import { useAssetMetadata, useAssetsMetadataLoading, useGetTokenOrGasMetadata } from 'lib/metadata';
import { useRetryableSWR, useTypedSWR } from 'lib/swr';
import { useTezos, useAccount, useChainId, ReactiveTezosToolkit, useChainIdLoading } from 'lib/temple/front';
import { michelEncoder, loadFastRpcClient, atomsToTokens } from 'lib/temple/helpers';
import { isTruthy } from 'lib/utils';

import { fetchRawBalance as fetchRawBalanceFromBlockchain } from './fetch';
import { getBalanceSWRKey } from './utils';

export const useCurrentAccountBalances = () => {
  const { publicKeyHash } = useAccount();
  const chainId = useChainId(true)!;

  return useAllAccountBalancesSelector(publicKeyHash, chainId);
};

export const useGetCurrentAccountTokenOrGasBalanceWithDecimals = () => {
  const rawBalances = useCurrentAccountBalances();
  const getMetadata = useGetTokenOrGasMetadata();

  return useCallback(
    (slug: string) => {
      const rawBalance = rawBalances[slug] as string | undefined;
      const metadata = getMetadata(slug);

      return rawBalance && metadata ? atomsToTokens(new BigNumber(rawBalance), metadata.decimals) : undefined;
    },
    [rawBalances, getMetadata]
  );
};

function suspenseByReduxAction(cb: (action: AnyAction, stopSuspense: () => void) => void): never {
  throw new Promise<void>(resolve => {
    const unsubscribe = subscribeToActions(action => {
      const stopSuspense = () => {
        unsubscribe();
        resolve();
      };
      cb(action, stopSuspense);
    });
  });
}

interface _UseBalanceOptions {
  suspense?: boolean;
  networkRpc?: string;
  //
  //
  displayed?: boolean;
  initial?: BigNumber;
}

export function _useBalance(assetSlug: string, address: string, opts: _UseBalanceOptions = {}) {
  const dispatch = useDispatch();
  const nativeTezos = useTezos();
  const nativeRpcUrl = useMemo(() => nativeTezos.rpc.getRpcUrl(), [nativeTezos]);
  const { suspense = true, networkRpc = nativeRpcUrl, displayed = true, initial: fallbackData } = opts;
  const { data: chainId } = useChainIdLoading(networkRpc, opts.suspense);
  const assetMetadata = useAssetMetadata(assetSlug);
  const balances = useAllAccountBalancesSelector(address, chainId ?? '');
  const balancesAreLoading = useBalancesLoadingSelector(address, chainId ?? '');
  const balancesError = useBalancesErrorSelector(address, chainId ?? '');
  const balancesAreEmpty = Object.keys(balances).length === 0;
  const rawAlreadyFetchedBalance = useBalanceSelector(address, chainId ?? '', assetSlug);
  const shouldUseTzkt = !chainId || isKnownChainId(chainId);
  const triedToLoadGasBalance = useTriedToLoadGasBalanceSelector(address, chainId ?? '');
  const triedToLoadAssetsBalances = useTriedToLoadAssetsBalancesSelector(address, chainId ?? '');

  const tezos = useMemo(() => {
    if (opts.networkRpc) {
      const rpc = opts.networkRpc;
      const t = new ReactiveTezosToolkit(loadFastRpcClient(rpc), rpc);
      t.setPackerProvider(michelEncoder);
      return t;
    }

    return nativeTezos;
  }, [opts.networkRpc, nativeTezos]);

  const {
    data: localRawBalance,
    error: localBalanceError,
    isLoading: localIsSWRLoading,
    mutate: mutateBalanceFromBlockchain,
    isValidating: localIsSWRValidating
  } = useSWR(shouldUseTzkt ? null : getBalanceSWRKey(tezos, assetSlug, address), fetchRawBalanceFromBlockchain, {
    suspense,
    revalidateOnFocus: false,
    dedupingInterval: Math.round(BLOCK_DURATION / 2),
    fallbackData,
    refreshInterval: Math.round(BLOCK_DURATION / 2)
  });
  const localIsLoading = localIsSWRLoading || localIsSWRValidating;

  const assetsMetadataLoading = useAssetsMetadataLoading();

  const convertRawBalance = useCallback(
    (rawBalance: BigNumber.Value | undefined) => {
      if (!assetMetadata && assetsMetadataLoading && suspense) {
        suspenseByReduxAction((action, stopSuspense) => {
          switch (action.type) {
            case putTokensMetadataAction.type:
              const putTokensAction = action as ReturnType<typeof putTokensMetadataAction>;
              if (assetSlug in putTokensAction.payload.records) {
                stopSuspense();
              }
              break;
            case addWhitelistTokensMetadataAction.type:
              const addWhitelistTokensAction = action as ReturnType<typeof addWhitelistTokensMetadataAction>;
              if (
                addWhitelistTokensAction.payload.some(
                  ({ contractAddress, fa2TokenId }) => toTokenSlug(contractAddress, fa2TokenId) === assetSlug
                )
              ) {
                stopSuspense();
              }
              break;
            case resetTokensMetadataLoadingAction.type:
              stopSuspense();
              break;
          }
        });
      }

      // Metadata may really be absent for some assets, see account tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6
      // in Mainnet for example
      return rawBalance == null ? undefined : atomsToTokens(new BigNumber(rawBalance), assetMetadata?.decimals ?? 0);
    },
    [assetMetadata, assetSlug, assetsMetadataLoading, suspense]
  );

  const updateBalance = useCallback(async () => {
    if (shouldUseTzkt) {
      return convertRawBalance(rawAlreadyFetchedBalance) ?? new BigNumber(0);
    }

    if (!displayed) {
      return convertRawBalance(localRawBalance) ?? new BigNumber(0);
    }

    const result = await mutateBalanceFromBlockchain();

    return result!;
  }, [
    shouldUseTzkt,
    rawAlreadyFetchedBalance,
    displayed,
    localRawBalance,
    mutateBalanceFromBlockchain,
    convertRawBalance
  ]);

  useEffect(() => {
    if (localRawBalance && !localRawBalance.eq(rawAlreadyFetchedBalance ?? 0)) {
      dispatch(
        putTokensBalancesAction({
          publicKeyHash: address,
          chainId: chainId!,
          balances: {
            [assetSlug]: localRawBalance.toFixed()
          }
        })
      );
    }
  }, [dispatch, address, assetSlug, chainId, localRawBalance, rawAlreadyFetchedBalance]);

  const balance = useMemo(() => {
    if (rawAlreadyFetchedBalance) {
      return convertRawBalance(rawAlreadyFetchedBalance);
    }

    if (
      shouldUseTzkt &&
      !balancesAreEmpty &&
      (assetSlug === TEZ_TOKEN_SLUG ? triedToLoadGasBalance : triedToLoadAssetsBalances)
    ) {
      return new BigNumber(0);
    }

    if (shouldUseTzkt && !suspense) {
      return fallbackData;
    }

    if (shouldUseTzkt) {
      suspenseByReduxAction((action, stopSuspense) => {
        switch (action.type) {
          case putTokensBalancesAction.type:
            const putBalancesAction = action as ReturnType<typeof putTokensBalancesAction>;
            if (
              putBalancesAction.payload.publicKeyHash === address &&
              putBalancesAction.payload.chainId === chainId &&
              assetSlug in putBalancesAction.payload.balances
            ) {
              stopSuspense();
            }
            break;
          case loadAssetsBalancesActions.success.type:
          case loadAssetsBalancesActions.fail.type:
            const assetsSuccessAction = action as ReturnType<
              typeof loadAssetsBalancesActions.success | typeof loadAssetsBalancesActions.fail
            >;
            if (
              assetsSuccessAction.payload.publicKeyHash === address &&
              assetsSuccessAction.payload.chainId === chainId &&
              assetSlug !== TEZ_TOKEN_SLUG
            ) {
              stopSuspense();
            }
            break;
          case loadGasBalanceActions.success.type:
          case loadGasBalanceActions.fail.type:
            const gasSuccessAction = action as ReturnType<
              typeof loadGasBalanceActions.success | typeof loadGasBalanceActions.fail
            >;
            if (
              gasSuccessAction.payload.publicKeyHash === address &&
              gasSuccessAction.payload.chainId === chainId &&
              assetSlug === TEZ_TOKEN_SLUG
            ) {
              stopSuspense();
            }
            break;
        }
      });
    }

    return convertRawBalance(localRawBalance);
  }, [
    rawAlreadyFetchedBalance,
    shouldUseTzkt,
    balancesAreEmpty,
    assetSlug,
    triedToLoadGasBalance,
    triedToLoadAssetsBalances,
    suspense,
    convertRawBalance,
    localRawBalance,
    fallbackData,
    address,
    chainId
  ]);

  const isLoading = shouldUseTzkt ? balancesAreLoading : localIsLoading;

  const error = useMemo(() => {
    if (shouldUseTzkt && balancesError) {
      return new Error(balancesError);
    }

    if (localBalanceError) {
      return localBalanceError;
    }

    return undefined;
  }, [shouldUseTzkt, balancesError, localBalanceError]);

  return useMemo(
    () => ({
      data: balance,
      error,
      isLoading,
      updateBalance
    }),
    [balance, error, isLoading, updateBalance]
  );
}

interface UseBalanceOptions {
  suspense?: boolean;
  networkRpc?: string;
}

/**
 * (!) Suspense not fully supported by this hook (turned off by def)
 * (!) Not initiating loading if from TZKT & missing
 */
export function useRawBalance(
  assetSlug: string,
  address: string,
  opts: UseBalanceOptions = {}
): {
  value: string | undefined;
  isSyncing: boolean;
  refresh: EmptyFn;
} {
  const dispatch = useDispatch();

  const { publicKeyHash: currentAccountAddress } = useAccount();
  const nativeTezos = useTezos();
  const nativeRpcUrl = useMemo(() => nativeTezos.rpc.getRpcUrl(), [nativeTezos]);

  const { networkRpc = nativeRpcUrl, suspense = false } = opts;

  // TODO: get `isLoading` of it
  const { data: chainId, isValidating: chainIdIsValidating } = useChainIdLoading(networkRpc);

  const allBalances = useAllBalancesSelector();
  const balances = useMemo(() => {
    if (!chainId) return null;

    const key = getKeyForBalancesRecord(address, chainId);

    return allBalances[key];
  }, [allBalances, chainId, address]);

  // const fromBlockchain = !isTruthy(balances);
  // const fromBlockchain = chainId && !isKnownChainId(chainId);

  // const rawBalanceFromStore = balances?.data[assetSlug];

  // const balancesAreKnownToStore = isTruthy(balances);
  // const usingStore = address === currentAccountAddress && isKnownChainId(chainId) && isTruthy(balances);
  const usingStore = address === currentAccountAddress && isKnownChainId(chainId);

  /*
  useEffect(() => {
    if (isKnownChainId(chainId) && !(balancesAreKnownToStore && balances.isLoading)) {
      dispatch(
        (assetSlug === TEZ_TOKEN_SLUG ? loadGasBalanceActions : loadAssetsBalancesActions).submit({
          chainId,
          publicKeyHash: address
        })
      );
    }
  }, [balances?.isLoading, balancesAreKnownToStore, chainId, assetSlug, address, dispatch]);
  */

  const tezos = useMemo(
    () => (opts.networkRpc ? buildTezosToolkit(opts.networkRpc) : nativeTezos),
    [opts.networkRpc, nativeTezos]
  );

  const onChainSwrResponse = useTypedSWR(
    getBalanceSWRKey(tezos, assetSlug, address),
    () => {
      if (!chainId || usingStore) return;

      return fetchRawBalanceFromBlockchain(tezos, assetSlug, address).then(res => res.toString());
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 20_000,
      refreshInterval: BLOCK_DURATION // TODO: refresh by new block only
    }
  );

  const refreshForOnChain = useCallback(() => onChainSwrResponse.mutate(), [onChainSwrResponse.mutate]);

  // Return // TODO: useMemo

  if (!chainId)
    return {
      value: undefined,
      isSyncing: chainIdIsValidating,
      refresh: emptyFn
    };

  if (usingStore)
    return {
      value: balances?.data[assetSlug],
      isSyncing: balances?.isLoading ?? false,
      /**
       * Stored balances are already being refreshed as frequently as possible
       * in `useBalancesLoading` hook.
       */
      refresh: emptyFn
    };

  return {
    value: onChainSwrResponse.data,
    isSyncing: onChainSwrResponse.isValidating,
    refresh: refreshForOnChain
  };
}

/**
 * (!) Suspense not fully supported by this hook (turned by def)
 * (!) Not initiating loading if from TZKT & missing
 */
export function useBalance(assetSlug: string, address: string, opts?: UseBalanceOptions) {
  const { value: rawValue, isSyncing, refresh } = useRawBalance(assetSlug, address, opts);
  const assetMetadata = useAssetMetadata(assetSlug);

  const value = useMemo(
    () => (rawValue && assetMetadata ? atomsToTokens(new BigNumber(rawValue), assetMetadata.decimals) : undefined),
    [rawValue, assetMetadata]
  );

  return { value, isSyncing, refresh, assetMetadata };
}

const buildTezosToolkit = memoizee(
  (rpcUrl: string) => {
    const t = new ReactiveTezosToolkit(loadFastRpcClient(rpcUrl), rpcUrl);
    t.setPackerProvider(michelEncoder);
    return t;
  },
  {
    max: 15,
    maxAge: 5 * 60_000
  }
);
