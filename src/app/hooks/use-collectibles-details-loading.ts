import { useDispatch } from 'react-redux';

import { loadCollectiblesDetailsActions } from 'app/store/collectibles/actions';
import { COLLECTIBLES_DETAILS_SYNC_INTERVAL } from 'lib/fixed-times';
import { useAccount } from 'lib/temple/front';
import { useInterval } from 'lib/ui/hooks';

export const useCollectiblesDetailsLoading = () => {
  const { publicKeyHash } = useAccount();
  const dispatch = useDispatch();

  useInterval(
    () => void dispatch(loadCollectiblesDetailsActions.submit(publicKeyHash)),
    COLLECTIBLES_DETAILS_SYNC_INTERVAL,
    [publicKeyHash, dispatch]
  );
};
