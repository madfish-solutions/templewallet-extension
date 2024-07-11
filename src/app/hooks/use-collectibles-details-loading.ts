import { dispatch } from 'app/store';
import { loadCollectiblesDetailsActions } from 'app/store/tezos/collectibles/actions';
import { useEnabledTezosChainAccountCollectiblesSlugs } from 'lib/assets/hooks';
import { COLLECTIBLES_DETAILS_SYNC_INTERVAL } from 'lib/fixed-times';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useInterval } from 'lib/ui/hooks';

export const useCollectiblesDetailsLoading = (publicKeyHash: string) => {
  const slugs = useEnabledTezosChainAccountCollectiblesSlugs(publicKeyHash, TEZOS_MAINNET_CHAIN_ID);

  useInterval(
    () => {
      if (slugs.length) dispatch(loadCollectiblesDetailsActions.submit(slugs));
    },
    [slugs],
    COLLECTIBLES_DETAILS_SYNC_INTERVAL
  );
};
