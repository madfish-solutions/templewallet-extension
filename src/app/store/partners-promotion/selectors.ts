import { DISABLE_ADS } from 'lib/env';

import { useSelector } from '..';

import { isAiChatAdsEnabled, isInBrowserAdsEnabled } from './state';

export const useShouldShowInWalletAdsSelector = () =>
  useSelector(({ partnersPromotion }) => !DISABLE_ADS && partnersPromotion.inWalletAdsEnabled);

export const useShouldShowInBrowserAdsSelector = () =>
  useSelector(({ partnersPromotion }) => !DISABLE_ADS && isInBrowserAdsEnabled(partnersPromotion));

export const useShouldShowAiChatAdsSelector = () =>
  useSelector(({ partnersPromotion }) => !DISABLE_ADS && isAiChatAdsEnabled(partnersPromotion));

export const usePromotionHidingTimestampSelector = (id: string) =>
  useSelector(({ partnersPromotion }) => partnersPromotion.promotionHidingTimestamps[id] ?? 0);
