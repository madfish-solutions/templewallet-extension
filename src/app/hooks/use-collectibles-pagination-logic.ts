import { useCallback, useMemo, useState } from 'react';

import { dispatch } from 'app/store';
import { putCollectiblesMetadataAction } from 'app/store/tezos/collectibles-metadata/actions';
import { useAllCollectiblesMetadataSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import { fromChainAssetSlug } from 'lib/assets/utils';
import { loadTokensMetadata } from 'lib/metadata/fetch';
import { useDidMount, useDidUpdate } from 'lib/ui/hooks';
import { setNavigateSearchParams } from 'lib/woozie';
import { createLocationState } from 'lib/woozie/location';
import { useAllTezosChains } from 'temple/front';
import { TezosNetworkEssentials } from 'temple/networks';

export const ITEMS_PER_PAGE = 30;

export const useTezosChainCollectiblesPaginationLogic = (allSlugsSorted: string[], network: TezosNetworkEssentials) => {
  const initialAmountParam = useMemo(() => {
    const { search } = createLocationState();
    const usp = new URLSearchParams(search);
    const amount = usp.get('amount');

    return amount ? Number(amount) : 0;
  }, []);

  const allMeta = useAllCollectiblesMetadataSelector();

  const [slugs, setSlugs] = useState<string[]>(() => {
    /* It should only be >0 on page reload */
    if (initialAmountParam) return allSlugsSorted.slice(0, initialAmountParam);

    // Attempt to have initial items show-up without loader
    const initialSlugs = allSlugsSorted.slice(0, ITEMS_PER_PAGE);
    const firstAbsentMetaI = initialSlugs.findIndex(slug => !allMeta.get(slug));
    return firstAbsentMetaI === -1 ? initialSlugs : initialSlugs.slice(0, firstAbsentMetaI);
  });

  const initialIsLoading = initialAmountParam ? false : Boolean(allSlugsSorted.length);
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
        await loadTokensMetadata(network, slugsWithoutMeta)
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
    [allSlugsSorted, slugs.length, allMeta, network]
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

export const useTezosAccountCollectiblesPaginationLogic = (allChainSlugsSorted: string[]) => {
  const initialAmountParam = useMemo(() => {
    const { search } = createLocationState();
    const usp = new URLSearchParams(search);
    const amount = usp.get('amount');

    return amount ? Number(amount) : 0;
  }, []);

  const tezosChains = useAllTezosChains();
  const allMeta = useAllCollectiblesMetadataSelector();

  const [slugs, setSlugs] = useState<string[]>(() => {
    /* It should only be >0 on page reload */
    if (initialAmountParam) return allChainSlugsSorted.slice(0, initialAmountParam);

    // Attempt to have initial items show-up without loader
    const initialSlugs = allChainSlugsSorted.slice(0, ITEMS_PER_PAGE);
    const firstAbsentMetaI = initialSlugs.findIndex(slug => !allMeta.get(slug));
    return firstAbsentMetaI === -1 ? initialSlugs : initialSlugs.slice(0, firstAbsentMetaI);
  });

  const initialIsLoading = initialAmountParam ? false : Boolean(allChainSlugsSorted.length);
  const [isLoading, setIsLoading] = useState(initialIsLoading);

  const _load = useCallback(
    async (size: number) => {
      setIsLoading(true);

      const nextSlugs = allChainSlugsSorted.slice(0, size);

      const chainSlugsWithoutMeta = nextSlugs
        // Not checking metadata of loaded items
        .slice(slugs.length)
        .filter(chainSlug => {
          const [_, _2, slug] = fromChainAssetSlug<string>(chainSlug);

          return !allMeta.get(slug);
        });

      if (chainSlugsWithoutMeta.length) {
        const uniqChainIds = new Set<string>();
        const slugsWithoutMeta: string[] = [];

        for (const chainSlug of chainSlugsWithoutMeta) {
          const [_, chainId, slug] = fromChainAssetSlug<string>(chainSlug);
          uniqChainIds.add(chainId);
          slugsWithoutMeta.push(slug);
        }

        for (const chainId of uniqChainIds) {
          if (!tezosChains[chainId]) continue;

          await loadTokensMetadata(tezosChains[chainId], slugsWithoutMeta)
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
        }
      } else {
        setSlugs(nextSlugs);
        setIsLoading(false);
      }

      setNavigateSearchParams({ amount: String(size) });
    },
    [allChainSlugsSorted, slugs.length, allMeta, tezosChains]
  );

  useDidMount(() => {
    if (initialIsLoading) _load(ITEMS_PER_PAGE);
  });

  useDidUpdate(() => {
    if (isLoading) return;

    if (slugs.length) _load(slugs.length);
    else if (allChainSlugsSorted.length) _load(ITEMS_PER_PAGE);
  }, [allChainSlugsSorted]);

  const loadNext = useCallback(() => {
    if (isLoading || slugs.length === allChainSlugsSorted.length) return;

    const size = (Math.floor(slugs.length / ITEMS_PER_PAGE) + 1) * ITEMS_PER_PAGE;

    _load(size);
  }, [_load, isLoading, slugs.length, allChainSlugsSorted.length]);

  return { slugs, isLoading, loadNext };
};
