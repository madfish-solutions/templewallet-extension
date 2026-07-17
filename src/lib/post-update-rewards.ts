import { fetchFromStorage, putToStorage } from 'lib/storage';

export const POST_UPDATE_REWARDS_LAST_OPENED_VERSION_STORAGE_KEY = 'POST_UPDATE_REWARDS_LAST_OPENED_VERSION';
export const POST_UPDATE_REWARDS_PROMO_STATE_STORAGE_KEY = 'POST_UPDATE_REWARDS_PROMO_STATE';

export const POST_UPDATE_REWARDS_MIN_PREVIOUS_VERSION = '2.0.29';
export const POST_UPDATE_REWARDS_ESTIMATED_MONTHLY_TKEY = 2435;

const CAMPAIGN_END = new Date(2026, 7, 1);

export interface PostUpdateRewardsPromoState {
  activatedAt: number;
  multiplierEndedAt?: number;
}

export const getPostUpdateRewardsDaysRemaining = (date = new Date()) => {
  if (!isPostUpdateRewardsCampaignActive(date)) return 0;

  const end = CAMPAIGN_END.getTime();
  return Math.ceil((end - date.getTime()) / (24 * 60 * 60 * 1000));
};

export const getPostUpdateRewardsEstimatedBonus = (date = new Date()) =>
  Math.round((POST_UPDATE_REWARDS_ESTIMATED_MONTHLY_TKEY / 31) * getPostUpdateRewardsDaysRemaining(date));

export const isPostUpdateRewardsCampaignActive = (date = new Date()) =>
  date.getFullYear() === 2026 && date.getMonth() === 6 && date.getTime() < CAMPAIGN_END.getTime();

export const isPostUpdateRewardsMultiplierActive = (state: PostUpdateRewardsPromoState | nullish, date = new Date()) =>
  Boolean(state && !state.multiplierEndedAt && isPostUpdateRewardsCampaignActive(date));

export const shouldOpenPostUpdateRewardsPage = (
  previousVersion: string | undefined,
  currentVersion: string,
  lastOpenedVersion: string | nullish,
  date = new Date()
) =>
  Boolean(
    previousVersion &&
    previousVersion !== currentVersion &&
    compareVersions(previousVersion, POST_UPDATE_REWARDS_MIN_PREVIOUS_VERSION) >= 0 &&
    lastOpenedVersion !== currentVersion &&
    isPostUpdateRewardsCampaignActive(date)
  );

export const getPostUpdateRewardsImpressionsCount = async () => {
  const state = await fetchFromStorage<PostUpdateRewardsPromoState>(POST_UPDATE_REWARDS_PROMO_STATE_STORAGE_KEY);

  return isPostUpdateRewardsMultiplierActive(state) ? 2 : 1;
};

export const activatePostUpdateRewardsPromo = () =>
  putToStorage<PostUpdateRewardsPromoState>(POST_UPDATE_REWARDS_PROMO_STATE_STORAGE_KEY, {
    activatedAt: Date.now()
  });

const compareVersions = (left: string, right: string) => {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index++) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }

  return 0;
};
