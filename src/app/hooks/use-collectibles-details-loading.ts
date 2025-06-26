import { dispatch } from 'app/store';
import { loadCollectiblesDetailsActions } from 'app/store/tezos/collectibles/actions';
import { useTezosChainAccountCollectibles } from 'lib/assets/hooks/collectibles';
import { COLLECTIBLES_DETAILS_SYNC_INTERVAL } from 'lib/fixed-times';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useInterval, useMemoWithCompare } from 'lib/ui/hooks';

export const useCollectiblesDetailsLoading = (publicKeyHash: string) => {
  const collectibles = useTezosChainAccountCollectibles(publicKeyHash, TEZOS_MAINNET_CHAIN_ID);

  const slugs = useMemoWithCompare(
    () => collectibles.filter(({ status }) => status === 'enabled').map(({ slug }) => slug),
    [collectibles]
  );

  useInterval(
    () => {
      if (slugs.length) dispatch(loadCollectiblesDetailsActions.submit(slugs));
    },
    [slugs],
    COLLECTIBLES_DETAILS_SYNC_INTERVAL
  );
};
