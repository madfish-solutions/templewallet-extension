import { useEffect, useMemo, useRef } from 'react';

import { ChainGroupedSlugs, ChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

/** @deprecated Use `usePreservedOrderSlugsToManage` */
export const useManageableSlugs = (
  manageActive: boolean,
  allSlugs: string[],
  sortedEnabledSlugs: string[],
  manageInactiveSlugs: string[]
) => {
  const allSlugsRef = useRef(allSlugs);
  const sortedEnabledSlugsRef = useRef(sortedEnabledSlugs);

  useEffect(() => {
    // keeping the same tokens order while manage is active
    if (!manageActive) {
      allSlugsRef.current = allSlugs;
      sortedEnabledSlugsRef.current = sortedEnabledSlugs;
    }
  }, [manageActive, allSlugs, sortedEnabledSlugs]);

  return useMemo(() => {
    if (!manageActive) return manageInactiveSlugs;

    const allTokenSlugsSet = new Set(allSlugs);
    const allUniqTokenSlugsSet = new Set(sortedEnabledSlugsRef.current.concat(allSlugsRef.current));

    return Array.from(allUniqTokenSlugsSet).filter(slug => allTokenSlugsSet.has(slug));
  }, [manageActive, manageInactiveSlugs, allSlugs]);
};

export const usePreservedOrderSlugsToManage = (enabledSlugsSorted: string[], otherSlugsSorted: string[]) => {
  const prevResultRef = useRef<string[]>([]);

  return useMemo(() => {
    const newConcated = Array.from(new Set(enabledSlugsSorted.concat(otherSlugsSorted)));

    const prevResult = prevResultRef.current;

    // Only needed for performance to not `prevResult.indexOf` multiple times
    const indexMap = new Map<string, number>(prevResult.map((slug, index) => [slug, index]));

    // Sorting with respect to previous order every time
    const newResult = prevResult.length
      ? newConcated.sort((a, b) => {
          const ai = indexMap.get(a);
          const bi = indexMap.get(b);

          if (ai == null || bi == null) return 0;

          return ai - bi;
        })
      : newConcated;

    prevResultRef.current = newResult;

    return newResult;
  }, [enabledSlugsSorted, otherSlugsSorted]);
};

export const usePreservedOrderSlugsGroupsToManage = <T extends TempleChainKind>(
  enabledSlugsSortedGroups: ChainGroupedSlugs<T> | null,
  otherSlugsSortedGroups: ChainGroupedSlugs<T>
) => {
  const prevResultRef = useRef<ChainGroupedSlugs<T>>([]);

  return useMemo(() => {
    if (!enabledSlugsSortedGroups) return null;

    const rawNewConcatenated = new Map(enabledSlugsSortedGroups);
    otherSlugsSortedGroups.forEach(([chainId, slugs]) => {
      if (rawNewConcatenated.has(chainId)) {
        rawNewConcatenated.set(chainId, Array.from(new Set(rawNewConcatenated.get(chainId)!.concat(slugs))));
      } else {
        rawNewConcatenated.set(chainId, Array.from(slugs));
      }
    });
    const newConcated = Array.from(rawNewConcatenated.entries());

    const prevResult = prevResultRef.current;
    const slugsIndexes = new Map<ChainId<T>, Map<string, number>>(
      prevResult.map(([chainId, slugs]) => [chainId, new Map<string, number>(slugs.map((slug, j) => [slug, j]))])
    );
    const chainsIndexMap = new Map<ChainId<T>, number>(prevResult.map(([chainId], i) => [chainId, i]));

    const newResult = prevResult.length
      ? newConcated
          .sort(([chainIdA], [chainIdB]) => {
            const ai = chainsIndexMap.get(chainIdA);
            const bi = chainsIndexMap.get(chainIdB);

            if (ai == null || bi == null) return 0;

            return ai - bi;
          })
          .map(([chainId, slugs]): [ChainId<T>, string[]] => [
            chainId,
            slugs.sort((a, b) => {
              const ai = slugsIndexes.get(chainId)?.get(a);
              const bi = slugsIndexes.get(chainId)?.get(b);

              if (ai == null || bi == null) return 0;

              return ai - bi;
            })
          ])
      : newConcated;

    prevResultRef.current = newResult;

    return newResult;
  }, [enabledSlugsSortedGroups, otherSlugsSortedGroups]);
};
