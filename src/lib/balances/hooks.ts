import { useCallback, useEffect, useMemo, useRef } from 'react';

import { emptyFn } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';
import { useDispatch } from 'react-redux';

import { setEvmBalancesLoadingState } from 'app/store/evm/actions';
import { loadEvmBalanceOnChainActions } from 'app/store/evm/balances/actions';
import {
  useRawEvmAccountBalancesSelector,
  useRawEvmChainAccountBalancesSelector,
  useRawEvmAssetBalanceSelector
} from 'app/store/evm/balances/selectors';
import { AssetSlugBalanceRecord, ChainIdTokenSlugsBalancesRecord } from 'app/store/evm/balances/state';
import { useEvmBalancesLoadingStateSelector, useEvmChainBalancesLoadingSelector } from 'app/store/evm/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import {
  useAllAccountBalancesSelector,
  useAllAccountBalancesEntitySelector,
  useBalancesAtomicRecordSelector
} from 'app/store/tezos/balances/selectors';
import { getKeyForBalancesRecord } from 'app/store/tezos/balances/utils';
import { isSupportedChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { isKnownChainId } from 'lib/apis/tzkt';
import { createEvmTransfersListener } from 'lib/evm/on-chain/evm-transfer-subscriptions';
import { EvmAssetStandard } from 'lib/evm/types';
import { EVM_BALANCES_SYNC_INTERVAL } from 'lib/fixed-times';
import {
  useGenericTezosAssetMetadata,
  useGetChainTokenOrGasMetadata,
  useGetTokenOrGasMetadata,
  useEvmGenericAssetMetadata,
  useGetEvmGasOrTokenMetadata
} from 'lib/metadata';
import { isEvmCollectible } from 'lib/metadata/utils';
import { useTypedSWR } from 'lib/swr';
import { atomsToTokens } from 'lib/temple/helpers';
import { useInterval, useUpdatableRef } from 'lib/ui/hooks';
import { isTruthy } from 'lib/utils';
import { useAccountAddressForEvm, useAccountAddressForTezos, useOnTezosBlock } from 'temple/front';
import { EvmNetworkEssentials, TezosNetworkEssentials } from 'temple/networks';
import { getReadOnlyTezos } from 'temple/tezos';

import { fetchRawBalance as fetchRawBalanceFromBlockchain } from './fetch';

const useGetBalanceWithDecimals = <RawBalances, ChainId>(
  rawBalances: RawBalances,
  getMetadata: (chainId: ChainId, slug: string) => { decimals?: number } | undefined,
  getBalance: (rawBalances: RawBalances, chainId: ChainId, slug: string) => string | undefined
) => {
  const rawBalancesRef = useUpdatableRef(rawBalances);

  return useCallback(
    (chainId: ChainId, slug: string) => {
      const rawBalance = getBalance(rawBalancesRef.current, chainId, slug);

      if (!rawBalance) return;

      const metadata = getMetadata(chainId, slug);

      return metadata?.decimals ? atomsToTokens(rawBalance, metadata.decimals) : undefined;
    },
    [getBalance, getMetadata, rawBalancesRef]
  );
};

const getRawEvmBalance = (rawBalances: ChainIdTokenSlugsBalancesRecord, chainId: number, slug: string) =>
  rawBalances[chainId]?.[slug];

export const useGetEvmTokenBalanceWithDecimals = (publicKeyHash: HexString) => {
  const rawBalances = useRawEvmAccountBalancesSelector(publicKeyHash);
  const getMetadata = useGetEvmGasOrTokenMetadata();

  return useGetBalanceWithDecimals(rawBalances, getMetadata, getRawEvmBalance);
};

const getRawEvmBalanceBySlugOnly = (rawBalances: AssetSlugBalanceRecord, _chainId: number, slug: string) =>
  rawBalances[slug];

export const useGetEvmChainTokenBalanceWithDecimals = (publicKeyHash: HexString, chainId: number) => {
  const rawBalances = useRawEvmChainAccountBalancesSelector(publicKeyHash, chainId);
  const getMetadata = useGetEvmGasOrTokenMetadata();

  const resultBase = useGetBalanceWithDecimals(rawBalances, getMetadata, getRawEvmBalanceBySlugOnly);

  return useCallback((slug: string) => resultBase(chainId, slug), [resultBase, chainId]);
};

export const useGetTezosAccountTokenOrGasBalanceWithDecimals = (publicKeyHash: string) => {
  const balancesAtomicRecord = useBalancesAtomicRecordSelector();
  const getChainMetadata = useGetTokenOrGasMetadata();

  const getRawTezosBalance = useCallback(
    (rawBalances: typeof balancesAtomicRecord, chainId: string, slug: string) =>
      rawBalances[getKeyForBalancesRecord(publicKeyHash, chainId)]?.data[slug],
    [publicKeyHash]
  );

  return useGetBalanceWithDecimals(balancesAtomicRecord, getChainMetadata, getRawTezosBalance);
};

const getRawTezBalanceBySlugOnly = (rawBalances: StringRecord, _chainId: string, slug: string) => rawBalances[slug];

export const useGetTezosChainAccountTokenOrGasBalanceWithDecimals = (publicKeyHash: string, tezosChainId: string) => {
  const rawBalances = useAllAccountBalancesSelector(publicKeyHash, tezosChainId);
  const getMetadata = useGetChainTokenOrGasMetadata(tezosChainId);
  const adaptedGetMetadata = useCallback((_chainId: string, slug: string) => getMetadata(slug), [getMetadata]);

  const resultBase = useGetBalanceWithDecimals(rawBalances, adaptedGetMetadata, getRawTezBalanceBySlugOnly);

  return useCallback((slug: string) => resultBase(tezosChainId, slug), [resultBase, tezosChainId]);
};

function useTezosAssetRawBalance(
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
  const assetMetadata = useGenericTezosAssetMetadata(assetSlug, network.chainId);

  const value = useMemo(
    () => (rawValue && assetMetadata ? atomsToTokens(new BigNumber(rawValue), assetMetadata.decimals) : undefined),
    [rawValue, assetMetadata]
  );

  return { rawValue, value, isSyncing, error, refresh, assetMetadata };
}

function useEvmAssetRawBalance(
  assetSlug: string,
  address: HexString,
  network: EvmNetworkEssentials,
  assetStandard?: EvmAssetStandard,
  forceFirstRefreshOnChain = false,
  forceOnChainRefresh = false
): {
  value: string | undefined;
  isSyncing: boolean;
  error?: unknown;
  refresh: EmptyFn;
} {
  const testnetModeEnabled = useTestnetModeEnabledSelector();
  const dispatch = useDispatch();
  const currentAccountAddress = useAccountAddressForEvm();

  const { chainId } = network;

  const storedBalance = useRawEvmAssetBalanceSelector(address, network.chainId, assetSlug);
  const isSyncing = useEvmChainBalancesLoadingSelector(chainId);
  const loadingFromApiState = useEvmBalancesLoadingStateSelector(chainId, 'api');
  const refreshOnChainDoneRef = useRef(false);
  const loadingFromApiError = isTruthy(loadingFromApiState?.error);

  const usingOnchainRequests = useMemo(() => {
    if (!isSupportedChainId(chainId) || currentAccountAddress !== address) {
      return true;
    }

    return testnetModeEnabled || loadingFromApiError || forceOnChainRefresh;
  }, [address, chainId, currentAccountAddress, forceOnChainRefresh, loadingFromApiError, testnetModeEnabled]);

  const evmTransfersListener = useMemo(
    () =>
      assetStandard && usingOnchainRequests
        ? createEvmTransfersListener(network, address, assetSlug, assetStandard)
        : undefined,
    [address, assetSlug, assetStandard, network, usingOnchainRequests]
  );

  const refreshBalanceOnChain = useCallback(() => {
    refreshOnChainDoneRef.current = true;
    // Blockchains with small block intervals are likely to decrease the app performance here
    if (assetStandard !== EvmAssetStandard.NATIVE) {
      dispatch(setEvmBalancesLoadingState({ chainId, isLoading: true, source: 'onchain' }));
    }
    dispatch(loadEvmBalanceOnChainActions.submit({ network, assetSlug, account: address, assetStandard }));
  }, [dispatch, chainId, network, assetSlug, address, assetStandard]);

  useInterval(
    () => {
      if (usingOnchainRequests || (forceFirstRefreshOnChain && !refreshOnChainDoneRef.current)) {
        refreshBalanceOnChain();
      }
    },
    [usingOnchainRequests, forceFirstRefreshOnChain, refreshBalanceOnChain],
    EVM_BALANCES_SYNC_INTERVAL,
    true
  );

  useEffect(
    () => evmTransfersListener?.subscribe(refreshBalanceOnChain),
    [address, assetSlug, chainId, evmTransfersListener, refreshBalanceOnChain, usingOnchainRequests]
  );

  return {
    value: storedBalance,
    isSyncing,
    refresh: refreshBalanceOnChain
  };
}

export function useEvmAssetBalance(
  assetSlug: string,
  address: HexString,
  network: EvmNetworkEssentials,
  forceFirstRefreshOnChain = false,
  forceOnChainRefresh = false
) {
  const metadata = useEvmGenericAssetMetadata(assetSlug, network.chainId);

  const {
    value: rawValue,
    isSyncing,
    error,
    refresh
  } = useEvmAssetRawBalance(
    assetSlug,
    address,
    network,
    metadata?.standard,
    forceFirstRefreshOnChain,
    forceOnChainRefresh
  );

  const value = useMemo(
    () => (rawValue && metadata ? atomsToTokens(new BigNumber(rawValue), metadata.decimals ?? 0) : undefined),
    [rawValue, metadata]
  );

  return { rawValue, value, isSyncing, error, refresh, metadata };
}

export function useEvmTokenBalance(assetSlug: string, address: HexString, network: EvmNetworkEssentials) {
  const { metadata, ...restProps } = useEvmAssetBalance(assetSlug, address, network);

  return !metadata || isEvmCollectible(metadata)
    ? { ...restProps, metadata: undefined, value: undefined }
    : { metadata, ...restProps };
}
