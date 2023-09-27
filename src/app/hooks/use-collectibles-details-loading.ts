import { isEqual } from 'lodash';
import { useDispatch } from 'react-redux';

import { loadCollectiblesDetailsActions } from 'app/store/collectibles/actions';
import { useAccountCollectibles } from 'lib/assets/hooks';
import { COLLECTIBLES_DETAILS_SYNC_INTERVAL } from 'lib/fixed-times';
import { useAccount, useChainId } from 'lib/temple/front';
import { useInterval, useMemoWithCompare } from 'lib/ui/hooks';

export const useCollectiblesDetailsLoading = () => {
  const chainId = useChainId()!;
  const { publicKeyHash } = useAccount();
  const collectibles = useAccountCollectibles(publicKeyHash, chainId);
  const dispatch = useDispatch();

  const slugs = useMemoWithCompare(() => collectibles.map(({ slug }) => slug).sort(), [collectibles], isEqual);

  useInterval(
    () => {
      if (slugs.length < 1) return;

      console.log('fuck', slugs);
      dispatch(loadCollectiblesDetailsActions.submit(slugs));
    },
    COLLECTIBLES_DETAILS_SYNC_INTERVAL,
    [slugs, dispatch]
  );
};
