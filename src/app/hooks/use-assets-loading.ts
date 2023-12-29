import { useEffect } from 'react';

import { dispatch } from 'app/store';
import {
  loadAccountTokensActions,
  loadTokensWhitelistActions,
  loadAccountCollectiblesActions
} from 'app/store/assets/actions';
import { useAreAssetsLoading } from 'app/store/assets/selectors';
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

  const tokensAreLoading = useAreAssetsLoading('tokens');

  useInterval(
    () => {
      if (!tokensAreLoading) dispatch(loadAccountTokensActions.submit({ account: publicKeyHash, chainId }));
    },
    ASSETS_SYNC_INTERVAL,
    [chainId, publicKeyHash]
  );

  const collectiblesAreLoading = useAreAssetsLoading('collectibles');

  useInterval(
    () => {
      if (!collectiblesAreLoading) dispatch(loadAccountCollectiblesActions.submit({ account: publicKeyHash, chainId }));
    },
    ASSETS_SYNC_INTERVAL,
    [chainId, publicKeyHash]
  );
};
