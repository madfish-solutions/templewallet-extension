import { useMemo } from 'react';

import { DisplayedGroup, StoredAccount, StoredHDGroup } from 'lib/temple/types';

import { getAllGroups } from '../get-all-groups';

export function useReadyTempleGroups(allAccounts: NonEmptyArray<StoredAccount>, hdGroups: StoredHDGroup[]) {
  /**
   * Groups
   */
  const allGroups = useMemo<DisplayedGroup[]>(() => getAllGroups(hdGroups, allAccounts), [hdGroups, allAccounts]);

  return { allGroups, hdGroups };
}
