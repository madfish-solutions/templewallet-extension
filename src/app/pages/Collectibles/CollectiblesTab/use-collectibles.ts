import { useCallback, useState } from 'react';

import { useDispatch } from 'react-redux';

import { addTokensMetadataAction } from 'app/store/tokens-metadata/actions';
import { useTokensMetadataSelector } from 'app/store/tokens-metadata/selectors';
import { loadTokensMetadata } from 'lib/metadata/fetch';
import { useNetwork } from 'lib/temple/front';
import { useDidMount, useDidUpdate } from 'lib/ui/hooks';

export const ITEMS_PER_PAGE = 30;

export const useCollectiblesWithLoading = (allEnabledSlugsSorted: string[]) => {
  const allMeta = useTokensMetadataSelector();

  const { rpcBaseURL: rpcUrl } = useNetwork();
  const dispatch = useDispatch();

  const [slugs, setSlugs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(allEnabledSlugsSorted.length));

  const _load = useCallback(
    async (size: number) => {
      setIsLoading(true);

      const newSlugs = allEnabledSlugsSorted.slice(0, size);

      const slugsWithoutMeta = newSlugs.filter(slug => !allMeta[slug]);
      console.log('_LOAD:', size, newSlugs.length, allEnabledSlugsSorted.length, slugsWithoutMeta.length);

      if (slugsWithoutMeta.length)
        await loadTokensMetadata(rpcUrl, slugsWithoutMeta)
          .then(
            newMeta => {
              if (newMeta.length) dispatch(addTokensMetadataAction(newMeta));
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
    [allEnabledSlugsSorted, allMeta, rpcUrl, dispatch]
  );

  useDidMount(() => {
    console.log('LOAD_ON_MOUNT:', isLoading);
    if (isLoading) _load(ITEMS_PER_PAGE);
  });

  useDidUpdate(() => {
    console.log('LOAD_ON_UPDATE:', isLoading, slugs.length);
    if (!isLoading && slugs.length) _load(slugs.length);
  }, [allEnabledSlugsSorted]); // (!) What if it's loading & then stops?

  const [loadNextSeed, setLoadNextSeed] = useState(0);

  const loadNext = useCallback(() => {
    console.log('LOAD_NEXT:', isLoading, slugs.length, allEnabledSlugsSorted.length);
    setLoadNextSeed(val => (val % 2) + 1);
    if (isLoading || slugs.length === allEnabledSlugsSorted.length) return;

    const size = (Math.floor(slugs.length / ITEMS_PER_PAGE) + 1) * ITEMS_PER_PAGE;

    _load(size);
  }, [_load, isLoading, slugs.length, allEnabledSlugsSorted.length]);

  return { slugs, isLoading, loadNext, loadNextSeed };
};
