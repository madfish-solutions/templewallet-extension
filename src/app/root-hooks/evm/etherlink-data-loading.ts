import { memo, useCallback, useMemo } from 'react';

import { dispatch } from 'app/store';
import { setEvmBalancesLoadingState, setEvmTokensExchangeRatesLoading } from 'app/store/evm/actions';
import { processLoadedEvmAssetsAction } from 'app/store/evm/assets/actions';
import {
  processLoadedEvmAssetsBalancesAction,
  processLoadedOnchainBalancesAction
} from 'app/store/evm/balances/actions';
import { useEvmAccountBalancesTimestampsSelector } from 'app/store/evm/balances/selectors';
import { useAllEvmChainsBalancesLoadingStatesSelector } from 'app/store/evm/selectors';
import { EvmBalancesSource } from 'app/store/evm/state';
import { processLoadedEvmExchangeRatesAction } from 'app/store/evm/tokens-exchange-rates/actions';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { EtherlinkChainId, isEtherlinkSupportedChainId } from 'lib/apis/etherlink';
import { EVM_BALANCES_SYNC_INTERVAL } from 'lib/fixed-times';
import { useUpdatableRef } from 'lib/ui/hooks';

import { EtherlinkBalancesResponse, getEtherlinkBalances } from './get-etherlink-balances';
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
  | [ApiDataLoader<EtherlinkBalancesResponse, EtherlinkChainId>, OnchainDataLoader<StringRecord>];

export const AppEtherlinkDataLoading = memo<{ publicKeyHash: HexString }>(({ publicKeyHash }) => {
  const isTestnetMode = useTestnetModeEnabledSelector();
  // Loading states for Etherlink balances and exchange rates should always be synced
  const balancesLoadingStates = useAllEvmChainsBalancesLoadingStatesSelector();
  const balancesLoadingStatesRef = useUpdatableRef(balancesLoadingStates);
  const balancesTimestamps = useEvmAccountBalancesTimestampsSelector(publicKeyHash);
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
      const loadingState = balancesLoadingStatesRef.current[chainId]?.[source];

      return loadingState?.isLoading ?? false;
    },
    [balancesLoadingStatesRef]
  );
  const isLoadingApi = useMemo(() => isLoadingFactory('api'), [isLoadingFactory]);
  const isLoadingOnChain = useMemo(() => isLoadingFactory('onchain'), [isLoadingFactory]);

  const setLoadingFactory = useCallback(
    (source: EvmBalancesSource) => (chainId: number, isLoading: boolean, error?: string) => {
      dispatch(setEvmBalancesLoadingState({ chainId, isLoading, source, error }));
      if (source === 'api') {
        dispatch(setEvmTokensExchangeRatesLoading({ chainId, isLoading: false }));
      }
    },
    []
  );
  const setLoadingApi = useMemo(() => setLoadingFactory('api'), [setLoadingFactory]);
  const setLoadingOnChain = useMemo(() => setLoadingFactory('onchain'), [setLoadingFactory]);

  const handleApiSuccess = useCallback(
    ({ chainId, data, timestamp }: SuccessPayload<EtherlinkBalancesResponse>) => {
      dispatch(processLoadedEvmAssetsAction({ publicKeyHash, chainId, data }));
      dispatch(processLoadedEvmAssetsBalancesAction({ publicKeyHash, chainId, data }));
      dispatch(processLoadedEvmExchangeRatesAction({ chainId, data, timestamp }));
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
        setLoadingFactory(source)(chainId, false, error),
    [setLoadingFactory]
  );
  const handleApiError = useMemo(() => handleErrorFactory('api'), [handleErrorFactory]);
  const handleOnchainError = useMemo(() => handleErrorFactory('onchain'), [handleErrorFactory]);

  const getEtherlinkBalancesFromApi = useCallback(
    (walletAddress: string, chainId: EtherlinkChainId) =>
      getEtherlinkBalances(walletAddress, chainId)
        .then(data => ({ data }))
        .catch(error => ({ error })),
    []
  );
  const getEvmBalancesFromChain = useGetBalancesFromChain(publicKeyHash, isEtherlinkSupportedChainId);

  const onChainLoader = useMemo<OnchainDataLoader<StringRecord>>(
    () => ({
      type: 'onchain',
      isLoading: isLoadingOnChain,
      setLoading: setLoadingOnChain,
      getData: getEvmBalancesFromChain,
      handleSuccess: handleOnchainSuccess,
      handleError: handleOnchainError,
      isApplicable: isEtherlinkSupportedChainId
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
              getData: getEtherlinkBalancesFromApi,
              handleSuccess: handleApiSuccess,
              handleError: handleApiError,
              isApplicable: isEtherlinkSupportedChainId
            },
            onChainLoader
          ],
    [
      getEtherlinkBalancesFromApi,
      handleApiError,
      handleApiSuccess,
      isLoadingApi,
      setLoadingApi,
      isTestnetMode,
      onChainLoader
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
