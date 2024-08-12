import { useEffect, useMemo, useRef } from 'react';

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
