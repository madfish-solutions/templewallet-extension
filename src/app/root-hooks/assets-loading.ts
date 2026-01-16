import { memo } from 'react';

import { dispatch } from 'app/store';
import {
  setAssetsIsLoadingAction,
  addAccountTokensAction,
  addAccountCollectiblesAction
} from 'app/store/tezos/assets/actions';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { putTokensBalancesAction } from 'app/store/tezos/balances/actions';
import { fixBalances } from 'app/store/tezos/balances/utils';
import { putCollectiblesMetadataAction } from 'app/store/tezos/collectibles-metadata/actions';
import { useAllCollectiblesMetadataSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import { putTokensMetadataAction } from 'app/store/tezos/tokens-metadata/actions';
import { useAllTokensMetadataSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { isKnownChainId } from 'lib/apis/tzkt';
import { loadAccountCollectibles, loadAccountTokens } from 'lib/assets/fetching';
import { ASSETS_SYNC_INTERVAL } from 'lib/fixed-times';
import type { MetadataRecords, MetadataMap } from 'lib/metadata/types';
import { useInterval, useMemoWithCompare, useUpdatableRef } from 'lib/ui/hooks';
import { isTruthy } from 'lib/utils';
import { useEnabledTezosChains } from 'temple/front';

import { useShouldLoadTezosData } from './balances-loading/use-should-load-tezos-data';

export const AppTezosAssetsLoading = memo<{ publicKeyHash: string }>(({ publicKeyHash }) => {
  const tezosChains = useEnabledTezosChains();
  const shouldLoad = useShouldLoadTezosData();

  const networks = useMemoWithCompare(() => {
    if (!shouldLoad) return [];

    return tezosChains
      .map(({ chainId, rpcBaseURL }) => (isKnownChainId(chainId) ? { chainId, rpcBaseURL } : null))
      .filter(isTruthy);
  }, [shouldLoad, tezosChains]);

  const allTokensMetadata = useAllTokensMetadataSelector();
  const allTokensMetadataRef = useUpdatableRef(allTokensMetadata);
  const allCollectiblesMetadata = useAllCollectiblesMetadataSelector();
  const allCollectiblesMetadataRef = useUpdatableRef(allCollectiblesMetadata);

  /* Tokens loading */

  const tokensAreLoading = useAreAssetsLoading('tokens');

  useInterval(
    () => {
      if (tokensAreLoading || networks.length === 0) return;

      dispatch(setAssetsIsLoadingAction({ type: 'tokens', value: true, resetError: true }));

      const knownMetadata = mergeAssetsMetadata(allTokensMetadataRef.current, allCollectiblesMetadataRef.current);

      Promise.allSettled(
        networks.map(async network => {
          const chainId = network.chainId;

          const { slugs, balances, newMeta } = await loadAccountTokens(
            publicKeyHash,
            chainId,
            network.rpcBaseURL,
            knownMetadata
          );

          dispatch(addAccountTokensAction({ account: publicKeyHash, chainId, slugs }));
          dispatch(putTokensBalancesAction({ publicKeyHash, chainId, balances: fixBalances(balances) }));
          dispatch(putTokensMetadataAction({ records: newMeta }));
        })
      ).then(() => void dispatch(setAssetsIsLoadingAction({ type: 'tokens', value: false })));
    },
    [networks, publicKeyHash],
    ASSETS_SYNC_INTERVAL
  );

  /* Collectibles loading */

  const collectiblesAreLoading = useAreAssetsLoading('collectibles');

  useInterval(
    () => {
      if (collectiblesAreLoading || networks.length === 0) return;

      dispatch(setAssetsIsLoadingAction({ type: 'collectibles', value: true, resetError: true }));

      const knownMetadata = mergeAssetsMetadata(allTokensMetadataRef.current, allCollectiblesMetadataRef.current);

      Promise.allSettled(
        networks.map(async network => {
          const chainId = network.chainId;

          const { slugs, balances, newMeta } = await loadAccountCollectibles(publicKeyHash, chainId, knownMetadata);

          dispatch(addAccountCollectiblesAction({ account: publicKeyHash, chainId, slugs }));
          dispatch(putTokensBalancesAction({ publicKeyHash, chainId, balances: fixBalances(balances) }));
          dispatch(putCollectiblesMetadataAction({ records: newMeta }));
        })
      ).then(() => void dispatch(setAssetsIsLoadingAction({ type: 'collectibles', value: false })));
    },
    [networks, publicKeyHash],
    ASSETS_SYNC_INTERVAL
  );

  return null;
});

const mergeAssetsMetadata = (tokensMetadata: MetadataRecords, collectiblesMetadata: MetadataMap) => {
  const map = new Map(Object.entries(tokensMetadata));

  for (const [slug, metadata] of collectiblesMetadata) {
    map.set(slug, metadata);
  }

  return map;
};
