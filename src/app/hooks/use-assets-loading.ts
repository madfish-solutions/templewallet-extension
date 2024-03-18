import { useEffect } from 'react';

import { dispatch } from 'app/store';
import {
  loadAccountTokensActions,
  loadTokensWhitelistActions,
  loadAccountCollectiblesActions
} from 'app/store/assets/actions';
import { useAreAssetsLoading } from 'app/store/assets/selectors';
import { isKnownChainId } from 'lib/apis/tzkt';
import { ASSETS_SYNC_INTERVAL } from 'lib/fixed-times';
import { TempleTezosChainId } from 'lib/temple/types';
import { useInterval } from 'lib/ui/hooks';
import { useTezosNetwork } from 'temple/front';

export const useAssetsLoading = (publicKeyHash: string) => {
  const { chainId } = useTezosNetwork();

  useEffect(() => {
    if (chainId === TempleTezosChainId.Mainnet) dispatch(loadTokensWhitelistActions.submit());
  }, [chainId]);

  const tokensAreLoading = useAreAssetsLoading('tokens');

  useInterval(
    () => {
      if (!tokensAreLoading && isKnownChainId(chainId))
        dispatch(loadAccountTokensActions.submit({ account: publicKeyHash, chainId }));
    },
    ASSETS_SYNC_INTERVAL,
    [chainId, publicKeyHash]
  );

  const collectiblesAreLoading = useAreAssetsLoading('collectibles');

  useInterval(
    () => {
      if (!collectiblesAreLoading && isKnownChainId(chainId))
        dispatch(loadAccountCollectiblesActions.submit({ account: publicKeyHash, chainId }));
    },
    ASSETS_SYNC_INTERVAL,
    [chainId, publicKeyHash]
  );
};
