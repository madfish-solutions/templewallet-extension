import { StoredHDAccount } from 'lib/temple/types';
import { isAccountOfActableType } from 'temple/accounts';
import { useAllAccounts, useAccountForTezos, useAccountForEvm } from 'temple/front';

export const useAdsViewerPkh = () => {
  const allAccounts = useAllAccounts();
  const accountForTezos = useAccountForTezos();
  const accountForEvm = useAccountForEvm();
  const fallbackAccount = allAccounts[0] as StoredHDAccount | undefined;
  const { tezosAddress: fallbackTezosAddress, evmAddress: fallbackEvmAddress } = fallbackAccount ?? {};

  return {
    tezosAddress:
      accountForTezos && isAccountOfActableType(accountForTezos) ? accountForTezos.address : fallbackTezosAddress ?? '',
    evmAddress:
      accountForEvm && isAccountOfActableType(accountForEvm) ? accountForEvm.address : fallbackEvmAddress ?? ''
  };
};
