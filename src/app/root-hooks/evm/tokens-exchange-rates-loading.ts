import { memo, useCallback, useMemo } from 'react';

import { dispatch } from 'app/store';
import { setEvmTokensExchangeRatesLoading } from 'app/store/evm/actions';
import { useEvmChainsTokensExchangeRatesLoadingSelector } from 'app/store/evm/selectors';
import { processLoadedEvmExchangeRatesAction } from 'app/store/evm/tokens-exchange-rates/actions';
import { useEvmUsdToTokenRatesTimestampsSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { getEvmTokensMetadata } from 'lib/apis/temple/endpoints/evm';
import { BalancesResponse, ChainID } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { RATES_SYNC_INTERVAL } from 'lib/fixed-times';
import { useUpdatableRef } from 'lib/ui/hooks';

import { useRefreshIfActive, SuccessPayload, ErrorPayload, DataLoader } from './use-refresh-if-active';

/** Note: Rates are updated only for the given account's tokens */
export const AppEvmTokensExchangeRatesLoading = memo<{ publicKeyHash: HexString }>(({ publicKeyHash }) => {
  const isLoadingByChains = useEvmChainsTokensExchangeRatesLoadingSelector();
  const ratesTimestamps = useEvmUsdToTokenRatesTimestampsSelector();
  const isLoadingByChainsRef = useUpdatableRef(isLoadingByChains);
  const ratesTimestampsRef = useUpdatableRef(ratesTimestamps);

  const getDataTimestamp = useCallback(
    (chainId: number) => ratesTimestampsRef.current[chainId] ?? 0,
    [ratesTimestampsRef]
  );
  const isLoading = useCallback(
    (chainId: number) => isLoadingByChainsRef.current[chainId] ?? false,
    [isLoadingByChainsRef]
  );
  const setLoading = useCallback(
    (chainId: number, isLoading: boolean) => dispatch(setEvmTokensExchangeRatesLoading({ chainId, isLoading })),
    []
  );
  const handleSuccess = useCallback((data: SuccessPayload<BalancesResponse>) => {
    dispatch(processLoadedEvmExchangeRatesAction(data));
  }, []);
  const handleError = useCallback(({ chainId }: ErrorPayload) => {
    dispatch(setEvmTokensExchangeRatesLoading({ chainId, isLoading: false }));
  }, []);

  const getEvmTokensMetadataWrapped = useCallback(
    (walletAddress: string, chainId: ChainID) =>
      getEvmTokensMetadata(walletAddress, chainId)
        .then(data => ({ data }))
        .catch(error => ({ error })),
    []
  );

  const loaders = useMemo<[DataLoader<BalancesResponse>]>(
    () => [
      {
        type: 'api',
        isLoading,
        setLoading,
        getData: getEvmTokensMetadataWrapped,
        handleSuccess,
        handleError
      }
    ],
    [getEvmTokensMetadataWrapped, handleError, handleSuccess, isLoading, setLoading]
  );

  useRefreshIfActive({
    loaders,
    getDataTimestamp,
    publicKeyHash,
    syncInterval: RATES_SYNC_INTERVAL
  });

  return null;
});
