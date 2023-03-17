import { useSelector } from '..';

export const usePartnersPromoSelector = () => useSelector(state => state.partnersPromotion.promotion);
export const useShouldShowPartnersPromoSelector = () =>
  useSelector(({ partnersPromotion }) => partnersPromotion.shouldShowPromotion);
