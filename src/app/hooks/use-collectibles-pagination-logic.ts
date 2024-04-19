import { useCallback, useState } from 'react';

import { dispatch } from 'app/store';
import { putCollectiblesMetadataAction } from 'app/store/tezos/collectibles-metadata/actions';
import { useAllCollectiblesMetadataSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import { loadTokensMetadata } from 'lib/metadata/fetch';
import { useDidMount, useDidUpdate } from 'lib/ui/hooks';
import { setNavigateSearchParams } from 'lib/woozie';

export const ITEMS_PER_PAGE = 30;

export const useCollectiblesPaginationLogic = (allSlugsSorted: string[], rpcBaseURL: string, initialSize: number) => {
  const allMeta = useAllCollectiblesMetadataSelector();

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
        await loadTokensMetadata(rpcBaseURL, slugsWithoutMeta)
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
    [allSlugsSorted, slugs.length, allMeta, rpcBaseURL]
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
