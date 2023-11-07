import { useCallback, useState } from 'react';

import { useDispatch } from 'react-redux';

import { putCollectiblesMetadataAction } from 'app/store/collectibles-metadata/actions';
import { useAllCollectiblesMetadataSelector } from 'app/store/collectibles-metadata/selectors';
import { tokenToSlug } from 'lib/assets';
import { loadTokensMetadata } from 'lib/metadata/fetch';
import { useNetwork } from 'lib/temple/front';
import { useDidMount, useDidUpdate } from 'lib/ui/hooks';

export const ITEMS_PER_PAGE = 30;

export const useCollectiblesPaginationLogic = (allSlugsSorted: string[]) => {
  const allMeta = useAllCollectiblesMetadataSelector();

  const { rpcBaseURL: rpcUrl } = useNetwork();
  const dispatch = useDispatch();

  const [slugs, setSlugs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(allSlugsSorted.length));

  const _load = useCallback(
    async (size: number) => {
      setIsLoading(true);

      const newSlugs = allSlugsSorted.slice(0, size);

      const slugsWithoutMeta = newSlugs.filter(slug => !allMeta.some(m => tokenToSlug(m) === slug));
      console.log('_LOAD:', size, newSlugs.length, allSlugsSorted.length, slugsWithoutMeta.length);

      if (slugsWithoutMeta.length)
        await loadTokensMetadata(rpcUrl, slugsWithoutMeta)
          .then(
            records => {
              dispatch(putCollectiblesMetadataAction({ records }));
              setSlugs(newSlugs);
            },
            error => {
              console.error(error);
            }
          )
          .finally(() => setIsLoading(false));
      else {
        setSlugs(newSlugs);
        setIsLoading(false);
      }
    },
    [allSlugsSorted, allMeta, rpcUrl, dispatch]
  );

  useDidMount(() => {
    console.log('LOAD_ON_MOUNT:', isLoading);
    if (isLoading) _load(ITEMS_PER_PAGE);
  });

  useDidUpdate(() => {
    console.log('LOAD_ON_UPDATE:', isLoading, slugs.length);
    if (!isLoading && slugs.length) _load(slugs.length);
  }, [allSlugsSorted]); // (!) What if it's loading & then stops?

  const [seedForLoadNext, setSeedForLoadNext] = useState(0);

  const loadNext = useCallback(() => {
    console.log('LOAD_NEXT:', isLoading, slugs.length, allSlugsSorted.length);
    setSeedForLoadNext(val => (val % 2) + 1);
    if (isLoading || slugs.length === allSlugsSorted.length) return;

    const size = (Math.floor(slugs.length / ITEMS_PER_PAGE) + 1) * ITEMS_PER_PAGE;

    _load(size);
  }, [_load, isLoading, slugs.length, allSlugsSorted.length]);

  return { slugs, isLoading, loadNext, seedForLoadNext };
};
