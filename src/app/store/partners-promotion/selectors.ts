import { useSelector } from '..';

export const usePartnersPromoSelector = () => useSelector(state => state.partnersPromotion.promotion.data);
export const useIsAvailablePartnersPromoSelector = () =>
  useSelector(({ partnersPromotion }) => partnersPromotion.promotion.data.id !== partnersPromotion.lastSeenPromotionId);
