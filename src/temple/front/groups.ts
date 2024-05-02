import { useMemo } from 'react';

import { StoredAccount } from 'lib/temple/types';

import { getAllGroups } from './accounts-groups';
import { useHDGroups } from './ready';

export const useAccountsGroups = (accounts: StoredAccount[]) => {
  const hdGroups = useHDGroups();

  return useMemo(() => getAllGroups(hdGroups, accounts), [hdGroups, accounts]);
};
