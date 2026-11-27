import { AD_CAMPAIGN_POLICY_STORAGE_KEY } from 'lib/constants';
import { fetchFromStorage, putToStorage } from 'lib/storage';

import { getTempleAdsApiInstance } from './get-temple-ads-api';

interface CampaignPolicy {
  blacklistedHypelabCampaignsSlugs: string[];
  timestamp: number;
}

export const getCampaignPolicy = async (): Promise<CampaignPolicy> =>
  (await fetchFromStorage<CampaignPolicy>(AD_CAMPAIGN_POLICY_STORAGE_KEY)) ?? {
    blacklistedHypelabCampaignsSlugs: [],
    timestamp: 0
  };

export const refreshCampaignPolicy = async (): Promise<void> => {
  const policy = await getCampaignPolicy();
  if (policy.timestamp + 5 * 60_000 > Date.now()) return;
  const api = await getTempleAdsApiInstance();
  const blacklistedHypelabCampaignsSlugs = await api.getBlacklistedHypelabCampaignsSlugs();
  await putToStorage(AD_CAMPAIGN_POLICY_STORAGE_KEY, { blacklistedHypelabCampaignsSlugs, timestamp: Date.now() });
};
