import { isEqual } from 'lodash';

import { dispatch } from 'app/store';
import { loadCollectiblesDetailsActions } from 'app/store/collectibles/actions';
import { useAccountCollectibles } from 'lib/assets/hooks';
import { COLLECTIBLES_DETAILS_SYNC_INTERVAL } from 'lib/fixed-times';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useInterval, useMemoWithCompare } from 'lib/ui/hooks';

export const useCollectiblesDetailsLoading = (publicKeyHash: string) => {
  const collectibles = useAccountCollectibles(publicKeyHash, TEZOS_MAINNET_CHAIN_ID);

  const slugs = useMemoWithCompare(() => collectibles.map(({ slug }) => slug).sort(), [collectibles], isEqual);

  useInterval(
    () => {
      if (slugs.length) dispatch(loadCollectiblesDetailsActions.submit(slugs));
    },
    COLLECTIBLES_DETAILS_SYNC_INTERVAL,
    [slugs]
  );
};
