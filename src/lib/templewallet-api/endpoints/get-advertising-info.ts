import { templeWalletApi } from './templewallet.api';

export interface AdvertisingPromotion {
  name: string;
  url: string;
  fullPageBannerUrl: string;
  fullPageLogoUrl: string;
  popupBannerUrl: string;
  popupLogoUrl: string;
  mobileBannerUrl: string;
}

export const getAdvertisingInfo = () => templeWalletApi.get<AdvertisingPromotion>('/advertising-info');
