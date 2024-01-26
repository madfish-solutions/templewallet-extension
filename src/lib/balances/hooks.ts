import { useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { useDispatch } from 'react-redux';

import { subscribeToActions } from 'app/store';
import { loadAssetsBalancesActions } from 'app/store/balances/actions';
import {
  useAllAccountsAndChainsBalancesSelector,
  useAllBalancesSelector,
  useBalanceSelector
} from 'app/store/balances/selectors';
import { getKeyForBalancesRecord } from 'app/store/balances/utils';
import { isKnownChainId } from 'lib/apis/tzkt';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { ASSETS_SYNC_INTERVAL, BLOCK_DURATION } from 'lib/fixed-times';
import { useAssetMetadata, useGetTokenOrGasMetadata } from 'lib/metadata';
import { useRetryableSWR } from 'lib/swr';
import { useTezos, useAccount, useChainId, ReactiveTezosToolkit, useCustomChainId } from 'lib/temple/front';
import { michelEncoder, loadFastRpcClient, atomsToTokens } from 'lib/temple/helpers';

import { fetchBalance } from './fetch';
import { getBalanceSWRKey } from './utils';

export const useCurrentAccountBalances = () => {
  const { publicKeyHash } = useAccount();
  const chainId = useChainId(true)!;

  return useAllBalancesSelector(publicKeyHash, chainId);
};

export const useCurrentAccountAssetBalance = (slug: string) => {
  const { publicKeyHash } = useAccount();
  const chainId = useChainId(true)!;

  return useBalanceSelector(publicKeyHash, chainId, slug);
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
  const allBalances = useAllAccountsAndChainsBalancesSelector();
  const rawAlreadyFetchedBalance = useBalanceSelector(address, chainId ?? '', assetSlug);

  const convertRawBalance = useCallback(
    (rawBalance: string | undefined) => {
      if (!assetMetadata) {
        throw new Error('Metadata missing, when fetching balance');
      }

      return rawBalance ? atomsToTokens(new BigNumber(rawBalance), assetMetadata.decimals) : undefined;
    },
    [assetMetadata]
  );

  const alreadyFetchedBalance = useMemo(() => {
    try {
      return convertRawBalance(rawAlreadyFetchedBalance);
    } catch (e) {
      console.error(e);

      return undefined;
    }
  }, [convertRawBalance, rawAlreadyFetchedBalance]);

  const tezos = useMemo(() => {
    if (opts.networkRpc) {
      const rpc = opts.networkRpc;
      const t = new ReactiveTezosToolkit(loadFastRpcClient(rpc), rpc);
      t.setPackerProvider(michelEncoder);
      return t;
    }
    return nativeTezos;
  }, [opts.networkRpc, nativeTezos]);

  const fetchBalanceLocal = useCallback(async () => {
    const freshChainId = chainId ?? (await tezos.rpc.getChainId());

    if (!assetMetadata) {
      throw new Error('Metadata missing, when fetching balance');
    }

    if (!isKnownChainId(freshChainId) || assetSlug === TEZ_TOKEN_SLUG) {
      return fetchBalance(tezos, assetSlug, address, assetMetadata);
    }

    const publicKeyHashWithChainId = getKeyForBalancesRecord(address, freshChainId);
    const accountBalances = allBalances[publicKeyHashWithChainId]?.data ?? {};
    const balancesAreEmpty = Object.keys(accountBalances).length === 0;
    const balanceRawError = allBalances[publicKeyHashWithChainId]?.error;
    const balanceLoading = allBalances[publicKeyHashWithChainId]?.isLoading;
    const freshAlreadyFetchedBalance = convertRawBalance(accountBalances[assetSlug]);

    if (freshAlreadyFetchedBalance) {
      return freshAlreadyFetchedBalance;
    }

    if (balanceRawError) {
      throw new Error(balanceRawError);
    }

    if (!balanceLoading && balancesAreEmpty) {
      dispatch(loadAssetsBalancesActions.submit({ publicKeyHash: address, chainId: freshChainId }));
    }

    return new Promise<BigNumber>((res, rej) => {
      const unsubscribe = subscribeToActions(action => {
        switch (action.type) {
          case loadAssetsBalancesActions.success.type:
            const successAction = action as ReturnType<typeof loadAssetsBalancesActions.success>;
            const { publicKeyHash: newBalancesAddress, chainId: newBalancesChainId } = successAction.payload;
            if (newBalancesAddress === address && newBalancesChainId === freshChainId) {
              res(convertRawBalance(successAction.payload.balances[assetSlug]) ?? new BigNumber(0));
              unsubscribe();
            }
            break;
          case loadAssetsBalancesActions.fail.type:
            const errorAction = action as ReturnType<typeof loadAssetsBalancesActions.fail>;
            const { publicKeyHash: failedBalancesAddress, chainId: failedBalancesChainId } = errorAction.payload;
            if (failedBalancesAddress === address && failedBalancesChainId === freshChainId) {
              rej(new Error(errorAction.payload.error));
              unsubscribe();
            }
        }
      });
    });
  }, [chainId, tezos, assetMetadata, assetSlug, address, allBalances, convertRawBalance, dispatch]);

  const swrResponse = useRetryableSWR(
    displayed ? getBalanceSWRKey(tezos, assetSlug, address) : null,
    fetchBalanceLocal,
    {
      suspense,
      revalidateOnFocus: false,
      dedupingInterval: 20_000,
      fallbackData,
      refreshInterval: isKnownChainId(chainId) ? BLOCK_DURATION : ASSETS_SYNC_INTERVAL
    }
  );
  const { data, error, isValidating, isLoading } = swrResponse;

  const updateBalance = useCallback(async () => {
    const newBalance = await fetchBalanceLocal();
    swrResponse.mutate(newBalance);

    return newBalance;
  }, [fetchBalanceLocal, swrResponse]);

  return useMemo(
    () => ({
      data: alreadyFetchedBalance ?? data,
      error,
      isValidating,
      isLoading,
      updateBalance
    }),
    [alreadyFetchedBalance, data, error, isLoading, isValidating, updateBalance]
  );
}
