import { useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { loadTokensBalancesFromChainAction, loadTokensBalancesFromTzktAction } from 'app/store/balances/actions';
import { BALANCES_SYNC_INTERVAL } from 'lib/fixed-times';
import {
  useAccount,
  useChainId,
  useDisplayedFungibleTokens,
  useExplorerBaseUrls,
  useNetwork
} from 'lib/temple/front/index';
import { useInterval } from 'lib/ui/hooks';

export const useBalancesLoading = () => {
  const dispatch = useDispatch();

  const chainId = useChainId(true) ?? '';
  const { rpcBaseURL: rpcUrl } = useNetwork();

  const { publicKeyHash } = useAccount();
  const { api: apiUrl } = useExplorerBaseUrls();
  const { data: tokens = [] } = useDisplayedFungibleTokens(chainId, publicKeyHash);

  const load = useCallback(() => {
    if (apiUrl !== undefined) {
      dispatch(loadTokensBalancesFromTzktAction.submit({ apiUrl, publicKeyHash, chainId }));
    } else {
      dispatch(
        loadTokensBalancesFromChainAction.submit({
          rpcUrl,
          tokens,
          publicKeyHash,
          chainId
        })
      );
    }
  }, [chainId, publicKeyHash, apiUrl, rpcUrl]);

  useInterval(load, BALANCES_SYNC_INTERVAL, [load]);
};
