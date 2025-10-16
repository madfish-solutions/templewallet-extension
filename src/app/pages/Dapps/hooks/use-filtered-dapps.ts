import { useMemo } from 'react';

import { useDebounce } from 'use-debounce';

import { CustomDAppInfo, DappEnum } from 'lib/apis/temple/endpoints/get-dapps-list';
import { isSearchStringApplicable } from 'lib/utils/search-items';

const FEATURED_DAPPS_SLUGS = ['quipuswap', 'letsexchange', 'youves'];

export const useFilteredDapps = (dApps: CustomDAppInfo[], searchValue: string, selectedTags: DappEnum[]) => {
  const [searchValueDebounced] = useDebounce(searchValue, 300);
  const inSearch = isSearchStringApplicable(searchValueDebounced);
  const shouldIncludeFeatured = inSearch || selectedTags.length > 0;

  const featuredDApps = useMemo(() => {
    const featured = dApps.filter(({ slug }) => FEATURED_DAPPS_SLUGS.includes(slug));
    const others = dApps.filter(({ slug }) => !FEATURED_DAPPS_SLUGS.includes(slug));
    return [...featured, ...others.slice(0, 3 - featured.length)];
  }, [dApps]);

  const matchingDApps = useMemo(() => {
    const matching = inSearch
      ? dApps.filter(({ name }) => name.toLowerCase().includes(searchValueDebounced.toLowerCase()))
      : selectedTags.length
      ? dApps.filter(({ categories }) => selectedTags.some(selectedTag => categories.includes(selectedTag)))
      : dApps;

    return shouldIncludeFeatured ? matching : matching.filter(({ slug }) => !FEATURED_DAPPS_SLUGS.includes(slug));
  }, [dApps, inSearch, searchValueDebounced, selectedTags, shouldIncludeFeatured]);

  return {
    inSearch,
    shouldIncludeFeatured,
    featuredDApps,
    matchingDApps
  };
};
