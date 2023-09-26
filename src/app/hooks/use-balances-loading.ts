import { useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { loadTokensBalancesFromTzktAction } from 'app/store/balances/actions';
import { BALANCES_SYNC_INTERVAL } from 'lib/fixed-times';
import { useAccount, useChainId } from 'lib/temple/front';
import { useInterval } from 'lib/ui/hooks';

export const useBalancesLoading = () => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();

  const dispatch = useDispatch();

  const load = useCallback(
    () => void dispatch(loadTokensBalancesFromTzktAction.submit({ publicKeyHash, chainId })),
    [chainId, publicKeyHash]
  );

  // Not calling immediately, because balances are also loaded via assets loading
  useInterval(load, BALANCES_SYNC_INTERVAL, [load], false);
};
