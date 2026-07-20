import { compareVersions } from 'compare-versions';

import { fetchFromStorage, putToStorage } from 'lib/storage';

import { DOUBLE_REWARDS_ENGAGEMENT_PROMO_STATE_STORAGE_KEY } from './constants';

const DOUBLE_REWARDS_ENGAGEMENT_MIN_PREVIOUS_VERSION = '2.0.29';
const DOUBLE_REWARDS_ENGAGEMENT_ESTIMATED_MONTHLY_TKEY = 2435;

const CAMPAIGN_END = new Date(2026, 7, 1);

export interface DoubleRewardsEngagementPromoState {
  activatedAt: number;
  multiplierEndedAt?: number;
}

export const getDoubleRewardsEngagementDaysRemaining = (date = new Date()) => {
  if (!isDoubleRewardsEngagementCampaignActive(date)) return 0;

  const end = CAMPAIGN_END.getTime();
  return Math.ceil((end - date.getTime()) / (24 * 60 * 60 * 1000));
};

export const getDoubleRewardsEngagementEstimatedBonus = (date = new Date()) =>
  Math.round((DOUBLE_REWARDS_ENGAGEMENT_ESTIMATED_MONTHLY_TKEY / 31) * getDoubleRewardsEngagementDaysRemaining(date));

const isDoubleRewardsEngagementCampaignActive = (date = new Date()) =>
  date.getFullYear() === 2026 && date.getMonth() === 6 && date.getTime() < CAMPAIGN_END.getTime();

export const isDoubleRewardsEngagementMultiplierActive = (
  state: DoubleRewardsEngagementPromoState | nullish,
  date = new Date()
) => Boolean(state && !state.multiplierEndedAt && isDoubleRewardsEngagementCampaignActive(date));

export const shouldOpenDoubleRewardsEngagementModal = (
  previousVersion: string | undefined,
  currentVersion: string,
  lastOpenedVersion: string | nullish,
  date = new Date()
) =>
  Boolean(
    previousVersion &&
    previousVersion !== currentVersion &&
    compareVersions(previousVersion, DOUBLE_REWARDS_ENGAGEMENT_MIN_PREVIOUS_VERSION) >= 0 &&
    lastOpenedVersion !== currentVersion &&
    isDoubleRewardsEngagementCampaignActive(date)
  );

export const getDoubleRewardsEngagementImpressionsCount = async () => {
  const state = await fetchFromStorage<DoubleRewardsEngagementPromoState>(
    DOUBLE_REWARDS_ENGAGEMENT_PROMO_STATE_STORAGE_KEY
  );

  return isDoubleRewardsEngagementMultiplierActive(state) ? 2 : 1;
};

export const activateDoubleRewardsEngagementPromo = () =>
  putToStorage<DoubleRewardsEngagementPromoState>(DOUBLE_REWARDS_ENGAGEMENT_PROMO_STATE_STORAGE_KEY, {
    activatedAt: Date.now()
  });
