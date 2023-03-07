import { useSelector } from '..';

export const usePartnersPromoSelector = () => useSelector(state => state.partnersPromotion.promotion.data);
export const useSeenPartnersPromoIdsSelector = () =>
  useSelector(({ partnersPromotion }) => partnersPromotion.seenPromotionIds);
