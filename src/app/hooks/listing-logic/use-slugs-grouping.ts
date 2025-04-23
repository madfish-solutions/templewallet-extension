import { fromChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';

export const useChainsSlugsGrouping = <T extends string | number>(chainsSlugs: string[], active: boolean) =>
  useMemoWithCompare(() => {
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
