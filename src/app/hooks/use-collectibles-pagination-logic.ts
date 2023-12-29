import { useCallback, useState } from 'react';

import { useDispatch } from 'react-redux';

import { putCollectiblesMetadataAction } from 'app/store/collectibles-metadata/actions';
import { useAllCollectiblesMetadataSelector } from 'app/store/collectibles-metadata/selectors';
import { loadTokensMetadata } from 'lib/metadata/fetch';
import { useNetwork } from 'lib/temple/front';
import { useDidMount, useDidUpdate } from 'lib/ui/hooks';
import { setNavigateSearchParams } from 'lib/woozie';

export const ITEMS_PER_PAGE = 30;

export const useCollectiblesPaginationLogic = (allSlugsSorted: string[], initialSize: number) => {
  const allMeta = useAllCollectiblesMetadataSelector();

  const { rpcBaseURL: rpcUrl } = useNetwork();
  const dispatch = useDispatch();

  const [slugs, setSlugs] = useState<string[]>(() => allSlugsSorted.slice(0, initialSize));

  const initialIsLoading = initialSize ? false : Boolean(allSlugsSorted.length);
  const [isLoading, setIsLoading] = useState(initialIsLoading);

  const _load = useCallback(
    async (size: number) => {
      setIsLoading(true);

      const nextSlugs = allSlugsSorted.slice(0, size);

      const slugsWithoutMeta = nextSlugs
        // Not checking metadata of loaded items
        .slice(slugs.length)
        .filter(slug => !allMeta.get(slug));

      if (slugsWithoutMeta.length)
        await loadTokensMetadata(rpcUrl, slugsWithoutMeta)
          .then(
            records => {
              dispatch(putCollectiblesMetadataAction({ records }));
              setSlugs(nextSlugs);
            },
            error => {
              console.error(error);
            }
          )
          .finally(() => setIsLoading(false));
      else {
        setSlugs(nextSlugs);
        setIsLoading(false);
      }

      setNavigateSearchParams({ amount: String(size) });
    },
    [allSlugsSorted, slugs.length, allMeta, rpcUrl, dispatch]
  );

  useDidMount(() => {
    if (initialIsLoading) _load(ITEMS_PER_PAGE);
  });

  useDidUpdate(() => {
    if (isLoading) return;

    if (slugs.length) _load(slugs.length);
    else if (allSlugsSorted.length) _load(ITEMS_PER_PAGE);
  }, [allSlugsSorted]);

  const loadNext = useCallback(() => {
    if (isLoading || slugs.length === allSlugsSorted.length) return;

    const size = (Math.floor(slugs.length / ITEMS_PER_PAGE) + 1) * ITEMS_PER_PAGE;

    _load(size);
  }, [_load, isLoading, slugs.length, allSlugsSorted.length]);

  return { slugs, isLoading, loadNext };
};
