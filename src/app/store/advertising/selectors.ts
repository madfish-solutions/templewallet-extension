import { useSelector } from '../index';

export const useActivePromotionSelector = () => useSelector(({ advertising }) => advertising.activePromotion.data);

export const useIsNewPromotionAvailableSelector = () =>
  useSelector(({ advertising }) => advertising.lastSeenPromotionName !== advertising.activePromotion.data?.name);
