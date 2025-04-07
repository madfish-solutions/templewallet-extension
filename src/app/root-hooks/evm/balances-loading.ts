import { memo, useCallback } from 'react';

import { dispatch } from 'app/store';
import { setEvmBalancesLoadingState } from 'app/store/evm/actions';
import { processLoadedEvmAssetsAction } from 'app/store/evm/assets/actions';
import { processLoadedEvmAssetsBalancesAction } from 'app/store/evm/balances/actions';
import { useEvmAccountBalancesTimestampsSelector } from 'app/store/evm/balances/selectors';
import { useAllEvmChainsBalancesLoadingStatesSelector } from 'app/store/evm/selectors';
import { getEvmBalances } from 'lib/apis/temple/endpoints/evm';
import { BalancesResponse } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { EVM_BALANCES_SYNC_INTERVAL } from 'lib/fixed-times';
import { useUpdatableRef } from 'lib/ui/hooks';

import { ErrorPayload, SuccessPayload, useRefreshIfActive } from './use-refresh-if-active';

export const AppEvmBalancesLoading = memo<{ publicKeyHash: HexString }>(({ publicKeyHash }) => {
  const loadingStates = useAllEvmChainsBalancesLoadingStatesSelector();
  const balancesTimestamps = useEvmAccountBalancesTimestampsSelector(publicKeyHash);
  const loadingStatesRef = useUpdatableRef(loadingStates);
  const balancesTimestampsRef = useUpdatableRef(balancesTimestamps);

  const getDataTimestamp = useCallback(
    (chainId: number) => balancesTimestampsRef.current[chainId] ?? 0,
    [balancesTimestampsRef]
  );
  const isLoading = useCallback(
    (chainId: number) => loadingStatesRef.current[chainId]?.isLoading ?? false,
    [loadingStatesRef]
  );
  const setLoading = useCallback(
    (chainId: number, isLoading: boolean) => dispatch(setEvmBalancesLoadingState({ chainId, isLoading })),
    []
  );
  const handleSuccess = useCallback(
    ({ chainId, data, timestamp }: SuccessPayload<BalancesResponse>) => {
      dispatch(processLoadedEvmAssetsAction({ publicKeyHash, chainId, data }));
      dispatch(processLoadedEvmAssetsBalancesAction({ publicKeyHash, chainId, data, timestamp }));
      dispatch(setEvmBalancesLoadingState({ chainId, isLoading: false }));
    },
    [publicKeyHash]
  );
  const handleError = useCallback(
    ({ chainId }: ErrorPayload) => dispatch(setEvmBalancesLoadingState({ chainId, isLoading: false })),
    []
  );

  useRefreshIfActive({
    getDataTimestamp,
    isLoading,
    publicKeyHash,
    setLoading,
    getData: getEvmBalances,
    handleSuccess,
    handleError,
    syncInterval: EVM_BALANCES_SYNC_INTERVAL
  });

  return null;
});
