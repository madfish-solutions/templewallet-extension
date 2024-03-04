import { useSelector } from '..';

export const usePartnersPromoSelector = () => useSelector(state => state.partnersPromotion.promotion);
export const useShouldShowPartnersPromoSelector = () =>
  useSelector(({ partnersPromotion }) => partnersPromotion.shouldShowPromotion);

export const usePromotionHidingTimestampSelector = (id: string) =>
  useSelector(({ partnersPromotion }) => partnersPromotion.promotionHidingTimestamps[id] ?? 0);

export const useLastReportedPageNameSelector = () =>
  useSelector(({ partnersPromotion }) => partnersPromotion.lastReportedPageName);
