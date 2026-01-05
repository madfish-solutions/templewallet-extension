import { DISABLE_ADS } from 'lib/env';

import { useSelector } from '..';

export const useShouldShowPartnersPromoSelector = () =>
  useSelector(({ partnersPromotion }) => !DISABLE_ADS && partnersPromotion.shouldShowPromotion);

export const usePromotionHidingTimestampSelector = (id: string) =>
  useSelector(({ partnersPromotion }) => partnersPromotion.promotionHidingTimestamps[id] ?? 0);
