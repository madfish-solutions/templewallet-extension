import { useSelector } from '..';

export const useMerchantPromotionEnabledSelector = () =>
  useSelector(({ merchantPromotion }) => merchantPromotion.enabled);
