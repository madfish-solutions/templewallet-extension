import { useMemo } from 'react';

import { useTempleClient } from 'lib/temple/front';
import { StoredAccount } from 'lib/temple/types';

import { getAllGroups } from './get-all-groups';

export const useAccountsGroups = (accounts: StoredAccount[]) => {
  const { hdGroups } = useTempleClient();

  return useMemo(() => getAllGroups(hdGroups, accounts), [hdGroups, accounts]);
};
