import { useEffect } from 'react';

import { isAccountOfActableType } from 'temple/accounts';
import { useAccountForTezos, useAccountForEvm } from 'temple/front';

import { useRewardsAddresses } from './use-rewards-addresses';

export const useAdsViewerPkh = () => {
  const accountForTezos = useAccountForTezos();
  const accountForEvm = useAccountForEvm();
  const { tezosAddress: fallbackTezosAddress, evmAddress: fallbackEvmAddress } = useRewardsAddresses();
  const evmAddress =
    accountForEvm && isAccountOfActableType(accountForEvm) ? accountForEvm.address : fallbackEvmAddress ?? '';

  // Hypelab SDK allows only adding addresses to the list although its function is called `setWalletAddresses`
  // @ts-expect-error
  useEffect(() => void (evmAddress && window.__hype && (window.__hype.identity.wids = [evmAddress])), [evmAddress]);

  return {
    tezosAddress:
      accountForTezos && isAccountOfActableType(accountForTezos) ? accountForTezos.address : fallbackTezosAddress ?? '',
    evmAddress
  };
};
