import { memo, useCallback, useMemo } from 'react';

import { dispatch } from 'app/store';
import { setEvmBalancesLoadingState } from 'app/store/evm/actions';
import { processLoadedEvmAssetsAction } from 'app/store/evm/assets/actions';
import {
  processLoadedEvmAssetsBalancesAction,
  processLoadedOnchainBalancesAction
} from 'app/store/evm/balances/actions';
import { useEvmAccountBalancesTimestampsSelector } from 'app/store/evm/balances/selectors';
import { useAllEvmChainsBalancesLoadingStatesSelector } from 'app/store/evm/selectors';
import { EvmBalancesSource } from 'app/store/evm/state';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { isEtherlinkSupportedChainId } from 'lib/apis/etherlink';
import { getEvmBalances } from 'lib/apis/temple/endpoints/evm';
import { BalancesResponse, ChainID } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { isSupportedChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { EVM_BALANCES_SYNC_INTERVAL } from 'lib/fixed-times';
import { useUpdatableRef } from 'lib/ui/hooks';

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

  const handleApiSuccess = useCallback(
    ({ chainId, data }: SuccessPayload<BalancesResponse>) => {
      dispatch(processLoadedEvmAssetsAction({ publicKeyHash, chainId, data }));
      dispatch(processLoadedEvmAssetsBalancesAction({ publicKeyHash, chainId, data }));
      setLoadingApi(chainId, false);
    },
    [publicKeyHash, setLoadingApi]
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

  return null;
});
