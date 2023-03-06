import { useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { loadTokensBalancesFromChainAction, loadTokensBalancesFromTzktAction } from 'app/store/balances/actions';
import {
  useAccount,
  useChainId,
  useDisplayedFungibleTokens,
  useExplorerBaseUrls,
  useNetwork
} from 'lib/temple/front/index';
import { useSyncTokens } from 'lib/temple/front/sync-tokens';

export const useLoadBalances = () => {
  const dispatch = useDispatch();

  const chainId = useChainId(true)!;
  const isSyncing = useSyncTokens();
  const network = useNetwork();

  const { publicKeyHash } = useAccount();
  const { api: apiUrl } = useExplorerBaseUrls();
  const { data: tokens = [] } = useDisplayedFungibleTokens(chainId, publicKeyHash);

  useEffect(() => {
    if (apiUrl !== undefined) {
      dispatch(loadTokensBalancesFromTzktAction.submit({ apiUrl, accountPublicKeyHash: publicKeyHash }));
    } else {
      dispatch(
        loadTokensBalancesFromChainAction.submit({
          rpcUrl: network.rpcBaseURL,
          tokens,
          accountPublicKeyHash: publicKeyHash
        })
      );
    }
  }, [isSyncing, chainId, publicKeyHash, apiUrl, network.rpcBaseURL]);
};
