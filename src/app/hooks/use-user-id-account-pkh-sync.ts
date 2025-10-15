import { useEffect } from 'react';

import { useUserIdSelector } from 'app/store/settings/selectors';
import {
  ADS_VIEWER_DATA_STORAGE_KEY,
  ANALYTICS_USER_ID_STORAGE_KEY,
  REWARDS_ACCOUNT_DATA_STORAGE_KEY
} from 'lib/constants';
import { usePassiveStorage } from 'lib/temple/front/storage';
import { AdsViewerData, RewardsAddresses } from 'temple/types';

import { useAdsViewerPkh } from './use-ads-viewer-addresses';
import { useRewardsAddresses } from './use-rewards-addresses';

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

  const { tezosAddress, evmAddress } = useAdsViewerPkh();
  const rewardsAddresses = useRewardsAddresses();

  const [adsViewerData, setAdsViewerData] = usePassiveStorage<AdsViewerData>(ADS_VIEWER_DATA_STORAGE_KEY);
  const [rewardsAccountData, setRewardsAccountData] = usePassiveStorage<RewardsAddresses>(
    REWARDS_ACCOUNT_DATA_STORAGE_KEY
  );

  useEffect(() => {
    const { tezosAddress: storedTezosAddress, evmAddress: storedEvmAddress } = adsViewerData ?? {};

    if (tezosAddress !== storedTezosAddress || evmAddress !== storedEvmAddress) {
      setAdsViewerData({
        tezosAddress,
        evmAddress
      });
    }
  }, [adsViewerData, evmAddress, setAdsViewerData, tezosAddress]);
  useEffect(() => {
    const { tezosAddress: storedTezosAddress, evmAddress: storedEvmAddress } = rewardsAccountData ?? {};
    const { tezosAddress: rewardsTezosAddress, evmAddress: rewardsEvmAddress } = rewardsAddresses;

    if (rewardsTezosAddress !== storedTezosAddress || rewardsEvmAddress !== storedEvmAddress) {
      setRewardsAccountData(rewardsAddresses);
    }
  }, [rewardsAccountData, rewardsAddresses, setRewardsAccountData]);
};
