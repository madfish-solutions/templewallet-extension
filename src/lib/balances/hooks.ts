import { useCallback, useEffect, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { useDispatch } from 'react-redux';
import type { AnyAction } from 'redux';
import useSWR from 'swr';

import { subscribeToActions } from 'app/store';
import { loadAssetsBalancesActions, loadGasBalanceActions, putTokensBalancesAction } from 'app/store/balances/actions';
import {
  useAllBalancesSelector,
  useBalancesErrorSelector,
  useBalanceSelector,
  useBalancesLoadingSelector,
  useTriedToLoadGasBalanceSelector,
  useTriedToLoadAssetsBalancesSelector
} from 'app/store/balances/selectors';
import {
  addWhitelistTokensMetadataAction,
  putTokensMetadataAction,
  resetTokensMetadataLoadingAction
} from 'app/store/tokens-metadata/actions';
import { isKnownChainId } from 'lib/apis/tzkt';
import { toTokenSlug, TEZ_TOKEN_SLUG } from 'lib/assets';
import { BLOCK_DURATION } from 'lib/fixed-times';
import { useAssetMetadata, useAssetsMetadataLoading, useGetTokenOrGasMetadata } from 'lib/metadata';
import { useTezos, useAccount, useChainId, ReactiveTezosToolkit, useCustomChainId } from 'lib/temple/front';
import { michelEncoder, loadFastRpcClient, atomsToTokens } from 'lib/temple/helpers';

import { fetchBalance } from './fetch';
import { getBalanceSWRKey } from './utils';

export const useCurrentAccountBalances = () => {
  const { publicKeyHash } = useAccount();
  const chainId = useChainId(true)!;

  return useAllBalancesSelector(publicKeyHash, chainId);
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

type UseBalanceOptions = {
  suspense?: boolean;
  networkRpc?: string;
  displayed?: boolean;
  initial?: BigNumber;
};

export function useBalance(assetSlug: string, address: string, opts: UseBalanceOptions = {}) {
  const dispatch = useDispatch();
  const nativeTezos = useTezos();
  const nativeRpcUrl = useMemo(() => nativeTezos.rpc.getRpcUrl(), [nativeTezos]);
  const { suspense = true, networkRpc = nativeRpcUrl, displayed = true, initial: fallbackData } = opts;
  const chainId = useCustomChainId(networkRpc, opts.suspense);
  const assetMetadata = useAssetMetadata(assetSlug);
  const balances = useAllBalancesSelector(address, chainId ?? '');
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
  const getRawBalanceFromBlockchain = useCallback(
    () => fetchBalance(tezos, assetSlug, address, { decimals: 0 }),
    [address, assetSlug, tezos]
  );
  const {
    data: localRawBalance,
    error: localBalanceError,
    isLoading: localIsSWRLoading,
    mutate: mutateBalanceFromBlockchain,
    isValidating: localIsSWRValidating
  } = useSWR(shouldUseTzkt ? null : getBalanceSWRKey(tezos, assetSlug, address), getRawBalanceFromBlockchain, {
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

export const useCurrentAccountAssetBalance = (slug: string) => {
  const { publicKeyHash } = useAccount();

  const { data: balance } = useBalance(slug, publicKeyHash, { suspense: true });

  return balance!;
};
