import { useMemo } from 'react';

import { useAccount, useAllAccounts } from 'lib/temple/front';
import { isAccountOfActableType } from 'lib/temple/helpers';

export const useAdsViewerPkh = () => {
  const allAccounts = useAllAccounts();
  const selectedAccount = useAccount();

  return useMemo(() => {
    if (isAccountOfActableType(selectedAccount)) return selectedAccount.publicKeyHash;

    return allAccounts[0].publicKeyHash;
  }, [allAccounts, selectedAccount]);
};
