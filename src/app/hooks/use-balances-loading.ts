import { useDispatch } from 'react-redux';

import { loadGasBalanceActions, loadAssetsBalancesActions } from 'app/store/balances/actions';
import { BALANCES_SYNC_INTERVAL } from 'lib/fixed-times';
import { useAccount, useChainId } from 'lib/temple/front';
import { useInterval } from 'lib/ui/hooks';

export const useBalancesLoading = () => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();

  const dispatch = useDispatch();

  useInterval(
    () => void dispatch(loadGasBalanceActions.submit({ publicKeyHash, chainId })),
    BALANCES_SYNC_INTERVAL,
    [chainId, publicKeyHash],
    true
  );

  useInterval(
    () => void dispatch(loadAssetsBalancesActions.submit({ publicKeyHash, chainId })),
    BALANCES_SYNC_INTERVAL,
    [chainId, publicKeyHash],
    false // Not calling immediately, because balances are also loaded via assets loading
  );
};
