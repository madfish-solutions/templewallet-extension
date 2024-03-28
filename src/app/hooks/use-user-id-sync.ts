import { useEffect, useMemo } from 'react';

import { useUserIdSelector } from 'app/store/settings/selectors';
import { ADS_VIEWER_TEZOS_ADDRESS_STORAGE_KEY, ANALYTICS_USER_ID_STORAGE_KEY } from 'lib/constants';
import { usePassiveStorage } from 'lib/temple/front/storage';
import { StoredHDAccount } from 'lib/temple/types';
import { isAccountOfActableType } from 'temple/accounts';
import { useAllAccounts, useAccountForTezos } from 'temple/front';

export const useUserIdSync = () => {
  // User ID

  const [storedUserId, setStoredUserId] = usePassiveStorage<string>(ANALYTICS_USER_ID_STORAGE_KEY);
  const userId = useUserIdSelector();

  useEffect(() => {
    if (userId !== storedUserId) {
      setStoredUserId(userId);
    }
  }, [setStoredUserId, storedUserId, userId]);

  // ADs viewer address

  const allAccounts = useAllAccounts();
  const tezosAccount = useAccountForTezos();

  const adsViewerTezosAddress = useMemo(() => {
    if (tezosAccount && isAccountOfActableType(tezosAccount)) return tezosAccount.address;

    return (allAccounts[0] as StoredHDAccount)?.tezosAddress;
  }, [allAccounts, tezosAccount]);

  const [adsViewerTezosAddressStored, setAdsViewerTezosAddress] = usePassiveStorage<string>(
    ADS_VIEWER_TEZOS_ADDRESS_STORAGE_KEY
  );

  useEffect(() => {
    if (adsViewerTezosAddressStored !== adsViewerTezosAddress) setAdsViewerTezosAddress(adsViewerTezosAddress);
  }, [adsViewerTezosAddressStored, adsViewerTezosAddress, setAdsViewerTezosAddress]);
};
