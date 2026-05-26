import { useEffect, useRef } from 'react';

import { dispatch } from 'app/store';
import { loadCollectiblesDetailsActions } from 'app/store/tezos/collectibles/actions';
import {
  useAllCollectiblesDetailsLoadingSelector,
  useAllCollectiblesDetailsSelector
} from 'app/store/tezos/collectibles/selectors';
import { useTezosChainAccountCollectibles } from 'lib/assets/hooks/collectibles';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useMemoWithCompare } from 'lib/ui/hooks';

export const useMissingCollectiblesDetailsLoading = (publicKeyHash: string) => {
  const collectibles = useTezosChainAccountCollectibles(publicKeyHash, TEZOS_MAINNET_CHAIN_ID);
  const allTezosCollectiblesDetails = useAllCollectiblesDetailsSelector();
  const collectiblesDetailsLoading = useAllCollectiblesDetailsLoadingSelector();

  const prevSlugsRef = useRef<string[]>([]);
  const slugs = useMemoWithCompare(
    () =>
      collectibles
        .filter(({ status, slug }) => status === 'enabled' && !allTezosCollectiblesDetails[slug])
        .map(({ slug }) => slug),
    [collectibles, allTezosCollectiblesDetails]
  );

  useEffect(() => {
    if (slugs.length && !collectiblesDetailsLoading && prevSlugsRef.current !== slugs)
      dispatch(loadCollectiblesDetailsActions.submit(slugs));
    prevSlugsRef.current = slugs;
  }, [slugs, collectiblesDetailsLoading]);
};
