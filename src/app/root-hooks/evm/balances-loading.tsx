import React, { FC, memo, useCallback, useMemo } from 'react';

import { dispatch } from 'app/store';
import { setEvmBalancesLoadingState } from 'app/store/evm/actions';
import { useRawEvmAccountCollectiblesSelector, useRawEvmAccountTokensSelector } from 'app/store/evm/assets/selectors';
import { ChainIdTokenSlugsAssetsRecord } from 'app/store/evm/assets/state';
import { processLoadedOnchainBalancesAction } from 'app/store/evm/balances/actions';
import { useEvmAccountBalancesTimestampsSelector } from 'app/store/evm/balances/selectors';
import { useAllEvmChainsBalancesLoadingStatesSelector } from 'app/store/evm/selectors';
import { EvmBalancesSource } from 'app/store/evm/state';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { isEtherlinkSupportedChainId } from 'lib/apis/etherlink';
import { getEvmBalances } from 'lib/apis/temple/endpoints/evm';
import { BalancesResponse, ChainID } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { isSupportedChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { EVM_BALANCES_SYNC_INTERVAL } from 'lib/fixed-times';
import { useMemoWithCompare, useUpdatableRef } from 'lib/ui/hooks';
import { useEnabledEvmChains } from 'temple/front';
import { EvmNetworkEssentials } from 'temple/networks';

import { ManualAssets, makeOnEvmBalancesApiSuccess } from './make-on-evm-balances-api-success';
import { useGetBalancesFromChain } from './use-get-balances-from-chain';
import {
  ApiDataLoader,
  ErrorPayload,
  OnchainDataLoader,
  SuccessPayload,
  useRefreshIfActive
} from './use-refresh-if-active';

type Loaders =
  | [OnchainDataLoader<StringRecord>]
  | [ApiDataLoader<BalancesResponse, ChainID>, OnchainDataLoader<StringRecord>];

export const AppEvmBalancesLoading = memo<{ publicKeyHash: HexString }>(({ publicKeyHash }) => {
  const isTestnetMode = useTestnetModeEnabledSelector();
  const loadingStates = useAllEvmChainsBalancesLoadingStatesSelector();
  const balancesTimestamps = useEvmAccountBalancesTimestampsSelector(publicKeyHash);

  const storedTokens = useRawEvmAccountTokensSelector(publicKeyHash);
  const storedCollectibles = useRawEvmAccountCollectiblesSelector(publicKeyHash);
  const enabledEvmChains = useEnabledEvmChains();
  const enabledEvmChainsByIds = useMemo(
    () => Object.fromEntries(enabledEvmChains.map(chain => [chain.chainId, chain])),
    [enabledEvmChains]
  );
  const manualAssetsByChainId = useMemoWithCompare(() => {
    const result: ManualAssets = {};
    const pushManualAssetSlugs = (assets: ChainIdTokenSlugsAssetsRecord) => {
      for (const chainId in assets) {
        const chainAssets = assets[chainId];
        const network = enabledEvmChainsByIds[Number(chainId)];

        if (!chainAssets || !network) continue;

        for (const assetSlug in chainAssets) {
          const asset = chainAssets[assetSlug];
          if (asset?.manual) {
            if (!result[chainId]) {
              result[chainId] = { network, assetsSlugs: [] };
            }

            result[chainId].assetsSlugs.push(assetSlug);
          }
        }
      }
    };
    pushManualAssetSlugs(storedTokens);
    pushManualAssetSlugs(storedCollectibles);

    return result;
  }, [enabledEvmChainsByIds, storedCollectibles, storedTokens]);
  const manualAssets = useMemo(
    () =>
      Object.values(manualAssetsByChainId).flatMap(({ network, assetsSlugs }) =>
        assetsSlugs.map(assetSlug => ({ network, assetSlug }))
      ),
    [manualAssetsByChainId]
  );

  const loadingStatesRef = useUpdatableRef(loadingStates);
  const balancesTimestampsRef = useUpdatableRef(balancesTimestamps);

  const getDataTimestamp = useCallback(
    (chainId: number) => {
      const values = Object.values(balancesTimestampsRef.current[chainId] ?? {});

      return values.length === 0 ? 0 : Math.min(...values);
    },
    [balancesTimestampsRef]
  );

  const isLoadingFactory = useCallback(
    (source: EvmBalancesSource) => (chainId: number) => {
      const loadingState = loadingStatesRef.current[chainId]?.[source];

      return loadingState?.isLoading ?? false;
    },
    [loadingStatesRef]
  );
  const isLoadingApi = useMemo(() => isLoadingFactory('api'), [isLoadingFactory]);
  const isLoadingOnChain = useMemo(() => isLoadingFactory('onchain'), [isLoadingFactory]);

  const setLoadingFactory = useCallback(
    (source: EvmBalancesSource) => (chainId: number, isLoading: boolean) =>
      dispatch(
        setEvmBalancesLoadingState({
          chainId,
          isLoading,
          source
        })
      ),
    []
  );
  const setLoadingApi = useMemo(() => setLoadingFactory('api'), [setLoadingFactory]);
  const setLoadingOnChain = useMemo(() => setLoadingFactory('onchain'), [setLoadingFactory]);

  const handleApiSuccess = useMemo(
    () => makeOnEvmBalancesApiSuccess(publicKeyHash, manualAssetsByChainId, setLoadingApi),
    [manualAssetsByChainId, publicKeyHash, setLoadingApi]
  );
  const handleOnchainSuccess = useCallback(
    ({ chainId, data, timestamp }: SuccessPayload<StringRecord>) => {
      dispatch(processLoadedOnchainBalancesAction({ account: publicKeyHash, chainId, balances: data, timestamp }));
      setLoadingOnChain(chainId, false);
    },
    [publicKeyHash, setLoadingOnChain]
  );

  const handleErrorFactory = useCallback(
    (source: EvmBalancesSource) =>
      ({ chainId, error }: ErrorPayload) =>
        dispatch(
          setEvmBalancesLoadingState({
            chainId,
            isLoading: false,
            error,
            source
          })
        ),
    []
  );
  const handleApiError = useMemo(() => handleErrorFactory('api'), [handleErrorFactory]);
  const handleOnchainError = useMemo(() => handleErrorFactory('onchain'), [handleErrorFactory]);

  const getEvmBalancesFromApi = useCallback(
    (walletAddress: string, chainId: ChainID) =>
      getEvmBalances(walletAddress, chainId)
        .then(data => ({ data }))
        .catch(error => ({ error })),
    []
  );
  const getEvmBalancesFromChain = useGetBalancesFromChain(publicKeyHash, isSupportedChainId);

  const onChainLoader = useMemo<OnchainDataLoader<StringRecord>>(
    () => ({
      type: 'onchain',
      isLoading: isLoadingOnChain,
      setLoading: setLoadingOnChain,
      getData: getEvmBalancesFromChain,
      handleSuccess: handleOnchainSuccess,
      handleError: handleOnchainError,
      isApplicable: (chainId): chainId is number => !isEtherlinkSupportedChainId(chainId)
    }),
    [isLoadingOnChain, setLoadingOnChain, getEvmBalancesFromChain, handleOnchainSuccess, handleOnchainError]
  );

  const loaders = useMemo<Loaders>(
    () =>
      isTestnetMode
        ? [onChainLoader]
        : [
            {
              type: 'api',
              isLoading: isLoadingApi,
              setLoading: setLoadingApi,
              getData: getEvmBalancesFromApi,
              handleSuccess: handleApiSuccess,
              handleError: handleApiError,
              isApplicable: isSupportedChainId
            },
            onChainLoader
          ],
    [getEvmBalancesFromApi, handleApiError, handleApiSuccess, isLoadingApi, setLoadingApi, isTestnetMode, onChainLoader]
  );

  useRefreshIfActive({
    getDataTimestamp,
    loaders,
    publicKeyHash,
    syncInterval: EVM_BALANCES_SYNC_INTERVAL
  });

  return isTestnetMode ? null : (
    <>
      {manualAssets.map(({ network, assetSlug }) => (
        <OnChainBalanceLoader
          key={`${network.chainId}-${assetSlug}`}
          assetSlug={assetSlug}
          address={publicKeyHash}
          network={network}
        />
      ))}
    </>
  );
});

interface OnChainBalanceLoaderProps {
  assetSlug: string;
  address: HexString;
  network: EvmNetworkEssentials;
}

const OnChainBalanceLoader: FC<OnChainBalanceLoaderProps> = ({ assetSlug, address, network }) => {
  useEvmAssetBalance(assetSlug, address, network, true, true);

  return null;
};
