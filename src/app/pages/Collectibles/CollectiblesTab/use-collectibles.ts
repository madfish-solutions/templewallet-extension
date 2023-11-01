import { useCallback, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAreAssetsLoading } from 'app/store/assets/selectors';
import { addTokensMetadataAction } from 'app/store/tokens-metadata/actions';
import { useTokensMetadataSelector } from 'app/store/tokens-metadata/selectors';
import { useAssetsSortPredicate } from 'lib/assets/use-filtered';
import { loadTokensMetadata } from 'lib/metadata/fetch';
import { useNetwork } from 'lib/temple/front';
import { useDidMount } from 'lib/ui/hooks';

const ITEMS_PER_PAGE = 30;

export const useCollectibles = (allEnabledSlugs: string[]) => {
  const allMeta = useTokensMetadataSelector();
  const assetsAreLoading = useAreAssetsLoading('collectibles');

  const { rpcBaseURL: rpcUrl } = useNetwork();
  const dispatch = useDispatch();

  const [slugs, setSlugs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const assetsSortPredicate = useAssetsSortPredicate();

  const loadNext = useCallback(async () => {
    if (isLoading || slugs.length >= allEnabledSlugs.length) return;

    setIsLoading(true);

    const newSlugs = allEnabledSlugs.slice(0, slugs.length + ITEMS_PER_PAGE);

    const slugsWithoutMeta = newSlugs.filter(slug => !allMeta[slug]);

    await loadTokensMetadata(rpcUrl, slugsWithoutMeta)
      .then(
        newMeta => {
          if (newMeta.length) dispatch(addTokensMetadataAction(newMeta));
          setSlugs(newSlugs.sort(assetsSortPredicate)); // (!) List tail might glitch
        },
        error => {
          console.error(error);
        }
      )
      .finally(() => setIsLoading(false));
  }, [isLoading, slugs.length, allEnabledSlugs, allMeta, rpcUrl, assetsSortPredicate, dispatch]);

  useDidMount(loadNext);

  const isSyncing = assetsAreLoading || isLoading;

  return { slugs, isSyncing, loadNext };
};
