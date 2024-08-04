import { useCallback, useMemo } from 'react';

import { emptyFn, isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useRawEvmAccountBalancesSelector, useRawEvmAssetBalanceSelector } from 'app/store/evm/balances/selectors';
import { useEvmCollectibleMetadataSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmBalancesLoadingStateSelector } from 'app/store/evm/selectors';
import {
  useEvmTokenMetadataSelector,
  useEvmTokensMetadataRecordSelector
} from 'app/store/evm/tokens-metadata/selectors';
import {
  useAllAccountBalancesSelector,
  useAllAccountBalancesEntitySelector,
  useBalancesAtomicRecordSelector
} from 'app/store/tezos/balances/selectors';
import { getKeyForBalancesRecord } from 'app/store/tezos/balances/utils';
import { isSupportedChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { isKnownChainId } from 'lib/apis/tzkt';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { fetchEvmRawBalance as fetchEvmRawBalanceFromBlockchain } from 'lib/evm/on-chain/balance';
import { EvmAssetStandard } from 'lib/evm/types';
import { EVM_BALANCES_SYNC_INTERVAL } from 'lib/fixed-times';
import { useTezosAssetMetadata, useGetChainTokenOrGasMetadata, useGetTokenOrGasMetadata } from 'lib/metadata';
import { EvmTokenMetadata } from 'lib/metadata/types';
import { useTypedSWR } from 'lib/swr';
import { atomsToTokens } from 'lib/temple/helpers';
import { useInterval } from 'lib/ui/hooks';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { useAccountAddressForEvm, useAccountAddressForTezos, useAllEvmChains, useOnTezosBlock } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';
import { TezosNetworkEssentials } from 'temple/networks';
import { getReadOnlyTezos } from 'temple/tezos';

import { fetchRawBalance as fetchRawBalanceFromBlockchain } from './fetch';

export const useGetEvmTokenBalanceWithDecimals = (publicKeyHash: HexString) => {
  const evmChains = useAllEvmChains();
  const rawBalances = useRawEvmAccountBalancesSelector(publicKeyHash);
  const tokensMetadata = useEvmTokensMetadataRecordSelector();

  return useCallback(
    (chainId: number, slug: string) => {
      const rawBalance = rawBalances[chainId]?.[slug] as string | undefined;

      if (!rawBalance) return;

      const metadata =
        slug === EVM_TOKEN_SLUG
          ? evmChains[chainId]?.currency
          : (tokensMetadata[chainId]?.[slug] as EvmTokenMetadata | undefined);

      return metadata?.decimals ? atomsToTokens(rawBalance, metadata.decimals) : undefined;
    },
    [evmChains, rawBalances, tokensMetadata]
  );
};

export const useGetTezosAccountTokenOrGasBalanceWithDecimals = (publicKeyHash: string) => {
  const balancesAtomicRecord = useBalancesAtomicRecordSelector();
  const getChainMetadata = useGetTokenOrGasMetadata();

  return useCallback(
    (chainId: string, slug: string) => {
      const key = getKeyForBalancesRecord(publicKeyHash, chainId);

      const rawBalance = balancesAtomicRecord[key]?.data[slug] as string | undefined;

      if (!rawBalance) return;

      const metadata = getChainMetadata(chainId, slug);

      return metadata?.decimals ? atomsToTokens(rawBalance, metadata.decimals) : undefined;
    },
    [balancesAtomicRecord, getChainMetadata, publicKeyHash]
  );
};

export const useGetTezosChainAccountTokenOrGasBalanceWithDecimals = (publicKeyHash: string, tezosChainId: string) => {
  const rawBalances = useAllAccountBalancesSelector(publicKeyHash, tezosChainId);
  const getMetadata = useGetChainTokenOrGasMetadata(tezosChainId);

  return useCallback(
    (slug: string) => {
      const rawBalance = rawBalances[slug] as string | undefined;

      if (!rawBalance) return;

      const metadata = getMetadata(slug);

      return metadata?.decimals ? atomsToTokens(rawBalance, metadata.decimals) : undefined;
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
    ['tez-asset-raw-balance', rpcBaseURL, assetSlug, address],
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
  const assetMetadata = useTezosAssetMetadata(assetSlug, network.chainId);

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

  if (!network || !currentAccountAddress) throw new DeadEndBoundaryError(); // TODO: Remove. Dangerous on such a micro level. Better user sees zero balance on some token than no tokens list at all.

  const { chainId, rpcBaseURL } = network;

  const storedBalance = useRawEvmAssetBalanceSelector(address, network.chainId, assetSlug);
  const storedLoadingState = useEvmBalancesLoadingStateSelector(chainId);
  const storedError = isDefined(storedLoadingState?.error);

  const usingStore = useMemo(
    () => address === currentAccountAddress && isSupportedChainId(chainId) && !storedError,
    [storedError, address, currentAccountAddress, chainId]
  );

  const onChainBalanceSwrRes = useTypedSWR(
    ['evm-asset-raw-balance', rpcBaseURL, assetSlug, address],
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
      value: storedBalance,
      isSyncing: storedLoadingState?.isLoading ?? false,
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

export function useEvmCollectibleBalance(assetSlug: string, address: HexString, evmChainId: number) {
  const metadata = useEvmCollectibleMetadataSelector(evmChainId, assetSlug);

  const {
    value: rawValue,
    isSyncing,
    error,
    refresh
  } = useEvmAssetRawBalance(assetSlug, address, evmChainId, metadata?.standard);

  const value = useMemo(() => (rawValue ? new BigNumber(rawValue) : undefined), [rawValue]);

  return { rawValue, value, isSyncing, error, refresh, metadata };
}
