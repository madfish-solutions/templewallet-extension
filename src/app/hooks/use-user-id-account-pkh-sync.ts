import { useEffect } from 'react';

import { useUserIdSelector } from 'app/store/settings/selectors';
import { ADS_VIEWER_ADDRESS_STORAGE_KEY, ANALYTICS_USER_ID_STORAGE_KEY } from 'lib/constants';
import { usePassiveStorage } from 'lib/temple/front/storage';

import { useAdsViewerPkh } from './use-ads-viewer-pkh';

export const useUserIdAccountPkhSync = () => {
  // User ID

  const [storedUserId, setStoredUserId] = usePassiveStorage<string>(ANALYTICS_USER_ID_STORAGE_KEY);
  const userId = useUserIdSelector();

  useEffect(() => {
    if (userId !== storedUserId) {
      setStoredUserId(userId);
    }
  }, [setStoredUserId, storedUserId, userId]);

  // ADs viewer address

  const adsViewerAddress = useAdsViewerPkh();

  const [adsViewerAddressStored, setAdsViewerAddress] = usePassiveStorage<string>(ADS_VIEWER_ADDRESS_STORAGE_KEY);

  useEffect(() => {
    if (adsViewerAddressStored !== adsViewerAddress) setAdsViewerAddress(adsViewerAddress);
  }, [adsViewerAddressStored, adsViewerAddress, setAdsViewerAddress]);
};
