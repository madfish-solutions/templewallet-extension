import { useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { loadTokensBalancesFromTzktAction } from 'app/store/balances/actions';
import { BALANCES_SYNC_INTERVAL } from 'lib/fixed-times';
import { useAccount, useChainId, useNetwork } from 'lib/temple/front';
import { useInterval } from 'lib/ui/hooks';

export const useBalancesLoading = () => {
  const dispatch = useDispatch();

  const chainId = useChainId(true) ?? '';
  const { rpcBaseURL: rpcUrl } = useNetwork();

  const { publicKeyHash } = useAccount();

  const load = useCallback(
    () => void dispatch(loadTokensBalancesFromTzktAction.submit({ publicKeyHash, chainId })),
    [chainId, publicKeyHash, rpcUrl]
  );

  useInterval(load, BALANCES_SYNC_INTERVAL, [load]);
};
