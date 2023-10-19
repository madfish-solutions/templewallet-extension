import { isEqual } from 'lodash';

import { dispatch } from 'app/store';
import { loadCollectiblesDetailsActions } from 'app/store/collectibles/actions';
import { useAccountCollectibles } from 'lib/assets/hooks';
import { COLLECTIBLES_DETAILS_SYNC_INTERVAL } from 'lib/fixed-times';
import { useAccount, useChainId } from 'lib/temple/front';
import { useInterval, useMemoWithCompare } from 'lib/ui/hooks';

export const useCollectiblesDetailsLoading = () => {
  const chainId = useChainId()!;
  const { publicKeyHash } = useAccount();
  const collectibles = useAccountCollectibles(publicKeyHash, chainId);

  const slugs = useMemoWithCompare(() => collectibles.map(({ slug }) => slug).sort(), [collectibles], isEqual);

  useInterval(
    () => {
      // Is it necessary for collectibles on non-Mainnet networks too?
      if (slugs.length) dispatch(loadCollectiblesDetailsActions.submit(slugs));
    },
    COLLECTIBLES_DETAILS_SYNC_INTERVAL,
    [slugs]
  );
};
