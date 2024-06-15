import { useCallback, useMemo } from 'react';

import { emptyFn } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import {
  useRawEvmAccountBalancesSelector,
  useRawEvmChainAccountBalancesSelector
} from 'app/store/evm/balances/selectors';
import { useEvmBalancesLoadingSelector } from 'app/store/evm/selectors';
import {
  useEvmTokenMetadataSelector,
  useEvmTokensMetadataRecordSelector
} from 'app/store/evm/tokens-metadata/selectors';
import { useAllAccountBalancesSelector, useAllAccountBalancesEntitySelector } from 'app/store/tezos/balances/selectors';
import { isSupportedChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { isKnownChainId } from 'lib/apis/tzkt';
import { fetchEvmRawBalance as fetchEvmRawBalanceFromBlockchain } from 'lib/evm/on-chain/balance';
import { useAssetMetadata, useGetTokenOrGasMetadata } from 'lib/metadata';
import { EvmTokenMetadata } from 'lib/metadata/types';
import { useTypedSWR } from 'lib/swr';
import { atomsToTokens } from 'lib/temple/helpers';
import { useInterval } from 'lib/ui/hooks';
import { useAccountAddressForEvm, useAccountAddressForTezos, useOnTezosBlock } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';
import { TezosNetworkEssentials } from 'temple/networks';
import { getReadOnlyTezos } from 'temple/tezos';

import { EvmAssetStandard } from '../evm/types';
import { EVM_BALANCES_SYNC_INTERVAL } from '../fixed-times';
import { isEvmNativeTokenSlug } from '../utils/evm.utils';

import { fetchRawBalance as fetchRawBalanceFromBlockchain } from './fetch';

export const useGetEvmTokenBalanceWithDecimals = (publicKeyHash: HexString) => {
  const rawBalances = useRawEvmAccountBalancesSelector(publicKeyHash);
  const tokensMetadata = useEvmTokensMetadataRecordSelector();

  return useCallback(
    (chainId: number, slug: string) => {
      const rawBalance = rawBalances[chainId]?.[slug] as string | undefined;
      const metadata = tokensMetadata[chainId]?.[slug] as EvmTokenMetadata | undefined;

      return rawBalance && metadata?.decimals ? atomsToTokens(new BigNumber(rawBalance), metadata.decimals) : undefined;
    },
    [rawBalances, tokensMetadata]
  );
};

export const useGetTezosTokenOrGasBalanceWithDecimals = (publicKeyHash: string, tezosChainId: string) => {
  const rawBalances = useAllAccountBalancesSelector(publicKeyHash, tezosChainId);
  const getMetadata = useGetTokenOrGasMetadata(tezosChainId);

  return useCallback(
    (slug: string) => {
      const rawBalance = rawBalances[slug] as string | undefined;
      const metadata = getMetadata(slug);

      return rawBalance && metadata ? atomsToTokens(new BigNumber(rawBalance), metadata.decimals) : undefined;
    },
    [rawBalances, getMetadata]
  );
};

export function useTezosAssetRawBalance(
  assetSlug: string,
  address: string,
  network: TezosNetworkEssentials
): {
  value: string | undefined;
  isSyncing: boolean;
  error?: unknown;
  refresh: EmptyFn;
} {
  const currentAccountAddress = useAccountAddressForTezos();

  const { chainId, rpcBaseURL } = network;

  const balances = useAllAccountBalancesEntitySelector(address, chainId);

  /** Only using store for currently selected account - most used case
   * and with a refresh mechanism in useBalancesLoading hook.
   * Other addresses' balances (e.g. of other user's accounts or contacts)
   * are loaded via SWR from chain.
   */
  const usingStore = address === currentAccountAddress && isKnownChainId(chainId);

  const onChainBalanceSwrRes = useTypedSWR(
    ['balance', rpcBaseURL, assetSlug, address],
    () => {
      if (usingStore) return;

      const tezos = getReadOnlyTezos(rpcBaseURL);

      return fetchRawBalanceFromBlockchain(tezos, assetSlug, address).then(res => res.toString());
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 20_000
    }
  );

  const refreshBalanceOnChain = useCallback(() => void onChainBalanceSwrRes.mutate(), [onChainBalanceSwrRes.mutate]);

  useOnTezosBlock(rpcBaseURL, refreshBalanceOnChain, usingStore);

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

export function useTezosAssetBalance(assetSlug: string, address: string, network: TezosNetworkEssentials) {
  const { value: rawValue, isSyncing, error, refresh } = useTezosAssetRawBalance(assetSlug, address, network);
  const assetMetadata = useAssetMetadata(assetSlug, network.chainId);

  const value = useMemo(
    () => (rawValue && assetMetadata ? atomsToTokens(new BigNumber(rawValue), assetMetadata.decimals) : undefined),
    [rawValue, assetMetadata]
  );

  return { rawValue, value, isSyncing, error, refresh, assetMetadata };
}

function useEvmAssetRawBalance(
  assetSlug: string,
  address: HexString,
  evmChainId: number,
  assetStandard?: EvmAssetStandard
): {
  value: string | undefined;
  isSyncing: boolean;
  error?: unknown;
  refresh: EmptyFn;
} {
  const currentAccountAddress = useAccountAddressForEvm();
  const network = useEvmChainByChainId(evmChainId);

  if (!network || !currentAccountAddress) throw new DeadEndBoundaryError();

  const { chainId, rpcBaseURL } = network;

  const balances = useRawEvmChainAccountBalancesSelector(address, network.chainId);
  const balancesLoading = useEvmBalancesLoadingSelector();

  const usingStore = address === currentAccountAddress && isSupportedChainId(chainId);

  const onChainBalanceSwrRes = useTypedSWR(
    ['evm-balance', rpcBaseURL, assetSlug, address],
    () => {
      if (usingStore) return;

      return fetchEvmRawBalanceFromBlockchain(network, assetSlug, address, assetStandard).then(res => res.toString());
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 20000
    }
  );

  const refreshBalanceOnChain = useCallback(() => void onChainBalanceSwrRes.mutate(), [onChainBalanceSwrRes.mutate]);

  useInterval(
    () => {
      if (usingStore) return;

      refreshBalanceOnChain();
    },
    [usingStore, refreshBalanceOnChain],
    EVM_BALANCES_SYNC_INTERVAL
  );

  if (usingStore)
    return {
      value: balances?.[assetSlug],
      isSyncing: balancesLoading,
      refresh: emptyFn
    };

  return {
    value: onChainBalanceSwrRes.data,
    isSyncing: onChainBalanceSwrRes.isValidating,
    error: onChainBalanceSwrRes.error,
    refresh: refreshBalanceOnChain
  };
}

export function useEvmTokenBalance(assetSlug: string, address: HexString, evmChainId: number) {
  const chain = useEvmChainByChainId(evmChainId);
  const tokenMetadata = useEvmTokenMetadataSelector(evmChainId, assetSlug);

  const metadata = isEvmNativeTokenSlug(assetSlug) ? chain?.currency : tokenMetadata;

  const {
    value: rawValue,
    isSyncing,
    error,
    refresh
  } = useEvmAssetRawBalance(assetSlug, address, evmChainId, metadata?.standard);

  const value = useMemo(
    () => (rawValue && metadata?.decimals ? atomsToTokens(new BigNumber(rawValue), metadata.decimals) : undefined),
    [rawValue, metadata]
  );

  return { rawValue, value, isSyncing, error, refresh, metadata };
}
