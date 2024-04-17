import { useMemo } from 'react';

import { useTempleClient } from 'lib/temple/front';
import { StoredAccount } from 'lib/temple/types';

import { useRelevantAccounts } from './accounts';
import { getAllGroups } from './get-all-groups';

export const useAccountsGroups = (accounts: StoredAccount[]) => {
  const { hdGroups } = useTempleClient();

  return useMemo(() => getAllGroups(hdGroups, accounts), [hdGroups, accounts]);
};

export const useRelevantAccountsGroups = (tezosChainId: string) => {
  const relevantAccounts = useRelevantAccounts(tezosChainId);

  return useAccountsGroups(relevantAccounts);
};
