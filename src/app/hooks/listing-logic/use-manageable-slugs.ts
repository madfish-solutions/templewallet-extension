import { useEffect, useMemo, useRef } from 'react';

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
