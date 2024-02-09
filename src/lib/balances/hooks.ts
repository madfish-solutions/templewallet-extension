import { useCallback, useMemo } from 'react';

import { emptyFn } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';
import memoizee from 'memoizee';

import { useAllAccountBalancesSelector, useAllBalancesSelector } from 'app/store/balances/selectors';
import { getKeyForBalancesRecord } from 'app/store/balances/utils';
import { isKnownChainId } from 'lib/apis/tzkt';
import { useAssetMetadata, useGetTokenOrGasMetadata } from 'lib/metadata';
import { useTypedSWR } from 'lib/swr';
import {
  useTezos,
  useAccount,
  useChainId,
  ReactiveTezosToolkit,
  useChainIdLoading,
  useOnBlock
} from 'lib/temple/front';
import { michelEncoder, loadFastRpcClient, atomsToTokens } from 'lib/temple/helpers';

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

interface UseBalanceOptions {
  // suspense?: boolean;
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
  error?: unknown;
  refresh: EmptyFn;
} {
  const { publicKeyHash: currentAccountAddress } = useAccount();
  const nativeTezos = useTezos();
  const nativeRpcUrl = useMemo(() => nativeTezos.rpc.getRpcUrl(), [nativeTezos]);

  const { networkRpc = nativeRpcUrl } = opts;

  // TODO: get `isLoading` of it
  const chainIdSwrRes = useChainIdLoading(networkRpc);
  const chainId = chainIdSwrRes.data;

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

  const onChainBalanceSwrRes = useTypedSWR(
    getBalanceSWRKey(tezos, assetSlug, address),
    () => {
      if (!chainId || usingStore) return;

      return fetchRawBalanceFromBlockchain(tezos, assetSlug, address).then(res => res.toString());
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 20_000
      // refreshInterval: BLOCK_DURATION
    }
  );

  const refreshChainId = useCallback(() => void chainIdSwrRes.mutate(), [chainIdSwrRes.mutate]);
  const refreshBalanceOnChain = useCallback(() => void onChainBalanceSwrRes.mutate(), [onChainBalanceSwrRes.mutate]);

  useOnBlock(refreshBalanceOnChain, tezos);

  // Return // TODO: useMemo

  if (!chainId)
    return {
      value: undefined,
      isSyncing: chainIdSwrRes.isValidating,
      error: chainIdSwrRes.error,
      refresh: refreshChainId
    };

  if (usingStore)
    return {
      value: balances?.data[assetSlug],
      isSyncing: balances?.isLoading ?? false,
      error: balances?.error,
      /**
       * Stored balances are already being refreshed as frequently as possible
       * in `useBalancesLoading` hook.
       */
      refresh: emptyFn
    };

  return {
    value: onChainBalanceSwrRes.data,
    isSyncing: onChainBalanceSwrRes.isValidating,
    error: onChainBalanceSwrRes.error,
    refresh: refreshBalanceOnChain
  };
}

/**
 * (!) Suspense not fully supported by this hook (turned by def)
 * (!) Not initiating loading if from TZKT & missing
 */
export function useBalance(assetSlug: string, address: string, opts?: UseBalanceOptions) {
  const { value: rawValue, isSyncing, error, refresh } = useRawBalance(assetSlug, address, opts);
  const assetMetadata = useAssetMetadata(assetSlug);

  const value = useMemo(
    () => (rawValue && assetMetadata ? atomsToTokens(new BigNumber(rawValue), assetMetadata.decimals) : undefined),
    [rawValue, assetMetadata]
  );

  return { rawValue, value, isSyncing, error, refresh, assetMetadata };
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
