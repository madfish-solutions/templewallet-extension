import { memo, useCallback, useMemo } from 'react';

import { dispatch } from 'app/store';
import { setEvmBalancesLoadingState } from 'app/store/evm/actions';
import { processLoadedEvmAssetsAction } from 'app/store/evm/assets/actions';
import {
  processLoadedEvmAssetsBalancesAction,
  processLoadedOnchainBalancesAction
} from 'app/store/evm/balances/actions';
import {
  useEvmAccountBalancesTimestampsSelector,
  useRawEvmAccountBalancesSelector
} from 'app/store/evm/balances/selectors';
import { useEvmCollectiblesMetadataRecordSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useAllEvmChainsBalancesLoadingStatesSelector } from 'app/store/evm/selectors';
import { EvmBalancesSource } from 'app/store/evm/state';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { getEvmBalances } from 'lib/apis/temple/endpoints/evm';
import { BalancesResponse, ChainID } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { isSupportedChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { evmOnChainBalancesRequestsExecutor } from 'lib/evm/on-chain/balance';
import { EVM_BALANCES_SYNC_INTERVAL } from 'lib/fixed-times';
import { useUpdatableRef } from 'lib/ui/hooks';
import { useEnabledEvmChains } from 'temple/front';

import { DataLoader, ErrorPayload, SuccessPayload, useRefreshIfActive } from './use-refresh-if-active';

type Loaders = [DataLoader<StringRecord>, DataLoader<BalancesResponse>] | [DataLoader<BalancesResponse>];

export const AppEvmBalancesLoading = memo<{ publicKeyHash: HexString }>(({ publicKeyHash }) => {
  const chains = useEnabledEvmChains();
  const testnetModeEnabled = useTestnetModeEnabledSelector();
  const loadingStates = useAllEvmChainsBalancesLoadingStatesSelector();
  const balancesTimestamps = useEvmAccountBalancesTimestampsSelector(publicKeyHash);
  const rawBalances = useRawEvmAccountBalancesSelector(publicKeyHash);
  const evmTokensMetadata = useEvmTokensMetadataRecordSelector();
  const evmCollectiblesMetadata = useEvmCollectiblesMetadataRecordSelector();

  const loadingStatesRef = useUpdatableRef(loadingStates);
  const balancesTimestampsRef = useUpdatableRef(balancesTimestamps);
  const rawBalancesRef = useUpdatableRef(rawBalances);
  const evmTokensMetadataRef = useUpdatableRef(evmTokensMetadata);
  const evmCollectiblesMetadataRef = useUpdatableRef(evmCollectiblesMetadata);

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

  const handleApiSuccess = useCallback(
    ({ chainId, data }: SuccessPayload<BalancesResponse>) => {
      dispatch(processLoadedEvmAssetsAction({ publicKeyHash, chainId, data }));
      dispatch(processLoadedEvmAssetsBalancesAction({ publicKeyHash, chainId, data }));
      dispatch(setEvmBalancesLoadingState({ chainId, isLoading: false, source: 'api' }));
    },
    [publicKeyHash]
  );
  const handleOnchainSuccess = useCallback(
    ({ chainId, data, timestamp }: SuccessPayload<StringRecord>) => {
      dispatch(processLoadedOnchainBalancesAction({ account: publicKeyHash, chainId, balances: data, timestamp }));
      dispatch(setEvmBalancesLoadingState({ chainId, isLoading: false, source: 'onchain' }));
    },
    [publicKeyHash]
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
  const getEvmBalancesFromChain = useCallback(
    async (walletAddress: HexString, chainId: number) => {
      let assetsSlugs = Object.keys(rawBalancesRef.current[chainId] ?? {});

      if (assetsSlugs.length === 0) {
        assetsSlugs = [EVM_TOKEN_SLUG];
      }

      const results = await Promise.allSettled(
        assetsSlugs.map(assetSlug =>
          evmOnChainBalancesRequestsExecutor
            .executeRequest({
              network: {
                chainId,
                rpcBaseURL: chains.find(chain => chain.chainId === chainId)!.rpcBaseURL
              },
              assetSlug,
              account: walletAddress,
              assetStandard:
                evmTokensMetadataRef.current[chainId]?.[assetSlug]?.standard ??
                evmCollectiblesMetadataRef.current[chainId]?.[assetSlug]?.standard,
              throwOnTimeout: isSupportedChainId(chainId)
            })
            .then(result => result.toFixed())
        )
      );
      const dataIsEmpty = !results.some(result => result.status === 'fulfilled');
      const error = results.find((res): res is PromiseRejectedResult => res.status === 'rejected')?.reason;

      if (dataIsEmpty) {
        return { error };
      }

      return {
        data: results.reduce<StringRecord>((acc, result, index) => {
          if (result.status === 'fulfilled') {
            const assetSlug = assetsSlugs[index];
            acc[assetSlug] = result.value;
          }

          return acc;
        }, {}),
        error
      };
    },
    [evmCollectiblesMetadataRef, evmTokensMetadataRef, rawBalancesRef, chains]
  );

  const apiLoader = useMemo<DataLoader<BalancesResponse>>(
    () => ({
      type: 'api',
      isLoading: isLoadingApi,
      setLoading: setLoadingApi,
      getData: getEvmBalancesFromApi,
      handleSuccess: handleApiSuccess,
      handleError: handleApiError
    }),
    [getEvmBalancesFromApi, handleApiError, handleApiSuccess, isLoadingApi, setLoadingApi]
  );

  const loaders = useMemo<Loaders>(
    () =>
      testnetModeEnabled
        ? [
            {
              type: 'onchain',
              isLoading: isLoadingOnChain,
              setLoading: setLoadingOnChain,
              getData: getEvmBalancesFromChain,
              handleSuccess: handleOnchainSuccess,
              handleError: handleOnchainError
            },
            apiLoader
          ]
        : [apiLoader],
    [
      testnetModeEnabled,
      isLoadingOnChain,
      setLoadingOnChain,
      getEvmBalancesFromChain,
      handleOnchainSuccess,
      handleOnchainError,
      apiLoader
    ]
  );

  useRefreshIfActive({
    getDataTimestamp,
    loaders,
    publicKeyHash,
    syncInterval: EVM_BALANCES_SYNC_INTERVAL
  });

  return null;
});
