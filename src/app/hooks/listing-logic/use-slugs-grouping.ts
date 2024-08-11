import { useMemo } from 'react';

import { fromChainAssetSlug } from 'lib/assets/utils';

export const useChainsSlugsGrouping = <T extends string | number>(chainsSlugs: string[], active: boolean) =>
  useMemo(() => {
    if (!active) return null;

    const result = new Map<T, string[]>();

    for (const chainSlug of chainsSlugs) {
      const [, chainId] = fromChainAssetSlug<T>(chainSlug);

      const slugs = result.get(chainId) ?? [];
      if (!result.has(chainId)) result.set(chainId, slugs);

      slugs.push(chainSlug);
    }

    return Array.from(result.entries());
  }, [chainsSlugs, active]);
