import { useSelector } from 'react-redux';

import { AdvertisingPromotion } from 'lib/templewallet-api';

import { AdvertisingRootState } from './advertising-state';

export const useActivePromotionSelector = () =>
  useSelector<AdvertisingRootState, AdvertisingPromotion | undefined>(
    ({ advertising }) => advertising.activePromotion.data
  );

export const useIsNewPromotionAvailableSelector = () =>
  useSelector<AdvertisingRootState, boolean>(
    ({ advertising }) => advertising.lastSeenPromotionName !== advertising.activePromotion.data?.name
  );
