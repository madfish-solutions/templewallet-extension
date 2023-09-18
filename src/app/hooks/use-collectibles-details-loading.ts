import { isEqual } from 'lodash';
import { useDispatch } from 'react-redux';

import { loadCollectiblesDetailsActions } from 'app/store/collectibles/actions';
import { COLLECTIBLES_DETAILS_SYNC_INTERVAL } from 'lib/fixed-times';
import { useAccount, useChainId, useCollectibleTokens } from 'lib/temple/front';
import { useInterval, useMemoWithCompare } from 'lib/ui/hooks';

export const useCollectiblesDetailsLoading = () => {
  const chainId = useChainId()!;
  const { publicKeyHash } = useAccount();
  const { data: collectibles } = useCollectibleTokens(chainId, publicKeyHash);
  const dispatch = useDispatch();

  const slugs = useMemoWithCompare(
    () => collectibles.map(({ tokenSlug }) => tokenSlug).sort(),
    [collectibles],
    isEqual
  );

  useInterval(
    () => {
      if (slugs.length < 1) return;

      dispatch(loadCollectiblesDetailsActions.submit(slugs));
    },
    COLLECTIBLES_DETAILS_SYNC_INTERVAL,
    [slugs, dispatch]
  );
};
