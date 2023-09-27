import { useEffect } from 'react';

import { dispatch } from 'app/store';
import {
  loadAccountTokensActions,
  loadTokensWhitelistActions,
  loadAccountCollectiblesActions
} from 'app/store/assets/actions';
import { useAccount, useChainId } from 'lib/temple/front';
import { TempleChainId } from 'lib/temple/types';

export const useAssetsLoading = () => {
  const chainId = useChainId()!;
  const { publicKeyHash } = useAccount();

  useEffect(() => {
    dispatch(loadAccountTokensActions.submit({ account: publicKeyHash, chainId }));
    dispatch(loadAccountCollectiblesActions.submit({ account: publicKeyHash, chainId }));
    if (chainId === TempleChainId.Mainnet) dispatch(loadTokensWhitelistActions.submit());
  }, [chainId, publicKeyHash]);
};
