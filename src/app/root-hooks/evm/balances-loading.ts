import { memo } from 'react';

import { dispatch } from 'app/store';
import { setEvmBalancesLoading } from 'app/store/evm/actions';
import { processLoadedEvmAssetsAction } from 'app/store/evm/assets/actions';
import { processLoadedEvmAssetsBalancesAction } from 'app/store/evm/balances/actions';
import { useEvmBalancesLoadingSelector } from 'app/store/evm/selectors';
import { getEvmBalances } from 'lib/apis/temple/endpoints/evm/api';
import { isSupportedChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { EVM_BALANCES_SYNC_INTERVAL } from 'lib/fixed-times';
import { useInterval, useMemoWithCompare } from 'lib/ui/hooks';
import { isTruthy } from 'lib/utils';
import { useEnabledEvmChains } from 'temple/front';

export const AppEvmBalancesLoading = memo<{ publicKeyHash: HexString }>(({ publicKeyHash }) => {
  const evmChains = useEnabledEvmChains();
  const balancesLoading = useEvmBalancesLoadingSelector();

  const apiSupportedChainIds = useMemoWithCompare(
    () => evmChains.map(({ chainId }) => (isSupportedChainId(chainId) ? chainId : null)).filter(isTruthy),
    [evmChains]
  );

  useInterval(
    () => {
      if (balancesLoading) return;

      dispatch(setEvmBalancesLoading(true));

      Promise.allSettled(
        apiSupportedChainIds.map(async chainId => {
          const data = await getEvmBalances(publicKeyHash, chainId);

          dispatch(processLoadedEvmAssetsAction({ publicKeyHash, chainId, data }));
          dispatch(processLoadedEvmAssetsBalancesAction({ publicKeyHash, chainId, data }));
        })
      ).then(() => void dispatch(setEvmBalancesLoading(false)));
    },
    [apiSupportedChainIds, publicKeyHash],
    EVM_BALANCES_SYNC_INTERVAL
  );

  return null;
});
