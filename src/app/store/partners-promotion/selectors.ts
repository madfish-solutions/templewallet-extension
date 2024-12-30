import { useSelector } from '..';

export const useShouldShowPartnersPromoSelector = () =>
  useSelector(({ partnersPromotion }) => partnersPromotion.shouldShowPromotion);

export const usePromotionHidingTimestampSelector = (id: string) =>
  useSelector(({ partnersPromotion }) => partnersPromotion.promotionHidingTimestamps[id] ?? 0);
