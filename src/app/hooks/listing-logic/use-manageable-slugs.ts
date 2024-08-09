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

export const usePreservedOrderSlugsToManage = (enabledSlugsSorted: string[], allSlugsSorted: string[]) => {
  const prevResultRef = useRef<string[]>([]);

  return useMemo(() => {
    const newConcated = Array.from(new Set(enabledSlugsSorted.concat(allSlugsSorted)));

    const prevResult = prevResultRef.current;

    // Sorting with respect to previous order every time
    const newResult = prevResult.length
      ? newConcated.sort((a, b) => {
          const ai = prevResult.indexOf(a);
          const bi = prevResult.indexOf(b);

          if (ai === -1 || bi === -1) return 0; // Only needed for performance

          return ai - bi;
        })
      : newConcated;

    prevResultRef.current = newResult;

    return newResult;
  }, [enabledSlugsSorted, allSlugsSorted]);
};
