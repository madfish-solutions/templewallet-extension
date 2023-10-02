import { useEffect } from 'react';

import { dispatch } from 'app/store';
import {
  loadAccountTokensActions,
  loadTokensWhitelistActions,
  loadAccountCollectiblesActions
} from 'app/store/assets/actions';
import { ASSETS_SYNC_INTERVAL } from 'lib/fixed-times';
import { useAccount, useChainId } from 'lib/temple/front';
import { TempleChainId } from 'lib/temple/types';
import { useInterval } from 'lib/ui/hooks';

export const useAssetsLoading = () => {
  const chainId = useChainId()!;
  const { publicKeyHash } = useAccount();

  useEffect(() => {
    if (chainId === TempleChainId.Mainnet) dispatch(loadTokensWhitelistActions.submit());
  }, [chainId]);

  useInterval(
    () => {
      dispatch(loadAccountTokensActions.submit({ account: publicKeyHash, chainId }));
      dispatch(loadAccountCollectiblesActions.submit({ account: publicKeyHash, chainId }));
    },
    ASSETS_SYNC_INTERVAL,
    [chainId, publicKeyHash]
  );
};
