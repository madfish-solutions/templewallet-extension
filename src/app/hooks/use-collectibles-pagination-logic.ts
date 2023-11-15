import { useCallback, useState } from 'react';

import { useDispatch } from 'react-redux';

import { putCollectiblesMetadataAction } from 'app/store/collectibles-metadata/actions';
import { useAllCollectiblesMetadataSelector } from 'app/store/collectibles-metadata/selectors';
import { tokenToSlug } from 'lib/assets';
import { loadTokensMetadata } from 'lib/metadata/fetch';
import { useNetwork } from 'lib/temple/front';
import { useDidMount, useDidUpdate } from 'lib/ui/hooks';
import { setNavigateSearchParams } from 'lib/woozie';

export const ITEMS_PER_PAGE = 30;

export const useCollectiblesPaginationLogic = (allSlugsSorted: string[], initialSize: number) => {
  const allMeta = useAllCollectiblesMetadataSelector();

  const { rpcBaseURL: rpcUrl } = useNetwork();
  const dispatch = useDispatch();

  // const [size, setSize] = useState(0);

  // const { data, isValidating } = useSWR(
  //   ['collectibles-pagination', size],
  //   async (data1, data2, data3) => {
  //     const nextSlugs = allSlugsSorted.slice(0, size);

  //     //
  //     return ['a', 'b'];
  //   },
  //   {
  //     //
  //   }
  // );

  const [slugs, setSlugs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(allSlugsSorted.length));

  const _load = useCallback(
    async (size: number) => {
      setIsLoading(true);

      const nextSlugs = allSlugsSorted.slice(0, size);

      const slugsWithoutMeta = nextSlugs
        // Not checking metadata of loaded items
        .slice(slugs.length)
        .filter(slug => !allMeta.some(m => tokenToSlug(m) === slug));

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

      setNavigateSearchParams({ size: String(size) });
    },
    [allSlugsSorted, slugs.length, allMeta, rpcUrl, dispatch]
  );

  useDidMount(() => {
    if (isLoading) _load(ITEMS_PER_PAGE);
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
