import { memo } from 'react';

import { dispatch } from 'app/store';
import { setEvmBalancesLoadingState } from 'app/store/evm/actions';
import { processLoadedEvmAssetsAction } from 'app/store/evm/assets/actions';
import { processLoadedEvmAssetsBalancesAction } from 'app/store/evm/balances/actions';
import { useAllEvmChainsBalancesLoadingStatesSelector } from 'app/store/evm/selectors';
import { getEvmBalances } from 'lib/apis/temple/endpoints/evm';
import { isSupportedChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { EVM_BALANCES_SYNC_INTERVAL } from 'lib/fixed-times';
import { useInterval, useMemoWithCompare } from 'lib/ui/hooks';
import { isTruthy } from 'lib/utils';
import { useEnabledEvmChains } from 'temple/front';

export const AppEvmBalancesLoading = memo<{ publicKeyHash: HexString }>(({ publicKeyHash }) => {
  const evmChains = useEnabledEvmChains();
  const loadingStates = useAllEvmChainsBalancesLoadingStatesSelector();

  const apiSupportedChainIds = useMemoWithCompare(
    () => evmChains.map(({ chainId }) => (isSupportedChainId(chainId) ? chainId : null)).filter(isTruthy),
    [evmChains]
  );

  useInterval(
    () => {
      for (const chainId of apiSupportedChainIds) {
        if (loadingStates[chainId]?.isLoading) continue;

        dispatch(setEvmBalancesLoadingState({ chainId, isLoading: true }));

        getEvmBalances(publicKeyHash, chainId).then(
          data => {
            dispatch(processLoadedEvmAssetsAction({ publicKeyHash, chainId, data }));
            dispatch(processLoadedEvmAssetsBalancesAction({ publicKeyHash, chainId, data }));
            dispatch(setEvmBalancesLoadingState({ chainId, isLoading: false }));
          },
          error => {
            console.error(error);
            dispatch(setEvmBalancesLoadingState({ chainId, isLoading: false, error: String(error) }));
          }
        );
      }
    },
    [apiSupportedChainIds, publicKeyHash],
    EVM_BALANCES_SYNC_INTERVAL
  );

  return null;
});
