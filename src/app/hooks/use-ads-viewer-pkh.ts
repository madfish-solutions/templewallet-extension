import { useMemo } from 'react';

import { useAllAccounts } from 'lib/temple/front';
import { StoredHDAccount } from 'lib/temple/types';
import { isAccountOfActableType } from 'temple/accounts';
import { useAccountForTezos } from 'temple/front';

export const useAdsViewerPkh = () => {
  const allAccounts = useAllAccounts();
  const accountForTezos = useAccountForTezos();

  return useMemo(() => {
    if (accountForTezos && isAccountOfActableType(accountForTezos)) return accountForTezos.address;

    return (allAccounts[0] as StoredHDAccount | undefined)?.tezosAddress ?? '';
  }, [allAccounts, accountForTezos]);
};
