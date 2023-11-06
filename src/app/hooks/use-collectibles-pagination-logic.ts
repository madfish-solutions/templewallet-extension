import { useCallback, useState } from 'react';

import { useDispatch } from 'react-redux';

import { addTokensMetadataAction } from 'app/store/tokens-metadata/actions';
import { useTokensMetadataSelector } from 'app/store/tokens-metadata/selectors';
import { loadTokensMetadata } from 'lib/metadata/fetch';
import { useNetwork } from 'lib/temple/front';
import { useDidMount, useDidUpdate } from 'lib/ui/hooks';

export const ITEMS_PER_PAGE = 30;

export const useCollectiblesPaginationLogic = (allSlugsSorted: string[]) => {
  const allMeta = useTokensMetadataSelector();

  const { rpcBaseURL: rpcUrl } = useNetwork();
  const dispatch = useDispatch();

  const [slugs, setSlugs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(allSlugsSorted.length));

  const _load = useCallback(
    async (size: number) => {
      setIsLoading(true);

      const newSlugs = allSlugsSorted.slice(0, size);

      const slugsWithoutMeta = newSlugs.filter(slug => !allMeta[slug]);

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
    [allSlugsSorted, allMeta, rpcUrl, dispatch]
  );

  useDidMount(() => {
    if (isLoading) _load(ITEMS_PER_PAGE);
  });

  useDidUpdate(() => {
    if (!isLoading && slugs.length) _load(slugs.length);
  }, [allSlugsSorted]);

  const [seedForLoadNext, setSeedForLoadNext] = useState(0);

  const loadNext = useCallback(() => {
    setSeedForLoadNext(val => (val % 2) + 1);
    if (isLoading || slugs.length === allSlugsSorted.length) return;

    const size = (Math.floor(slugs.length / ITEMS_PER_PAGE) + 1) * ITEMS_PER_PAGE;

    _load(size);
  }, [_load, isLoading, slugs.length, allSlugsSorted.length]);

  return { slugs, isLoading, loadNext, seedForLoadNext };
};
