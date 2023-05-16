import { useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { loadTokensBalancesFromTzktAction } from 'app/store/balances/actions';
import { BALANCES_SYNC_INTERVAL } from 'lib/fixed-times';
import { useAccount, useChainId, useNetwork } from 'lib/temple/front/index';
import { useSyncTokens } from 'lib/temple/front/sync-tokens';
import { useInterval } from 'lib/ui/hooks';

export const useBalancesLoading = () => {
  const dispatch = useDispatch();

  const chainId = useChainId(true) ?? '';
  const isSyncing = useSyncTokens();
  const { rpcBaseURL: rpcUrl } = useNetwork();

  const { publicKeyHash } = useAccount();

  const load = useCallback(() => {
    if (isSyncing !== false) return;

    dispatch(loadTokensBalancesFromTzktAction.submit({ publicKeyHash, chainId }));
  }, [isSyncing, chainId, publicKeyHash, rpcUrl]);

  useInterval(load, BALANCES_SYNC_INTERVAL, [load]);
};
