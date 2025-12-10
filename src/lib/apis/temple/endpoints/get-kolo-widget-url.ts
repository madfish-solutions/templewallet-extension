import { EnvVars } from 'lib/env';

import { templeWalletApi } from './templewallet.api';

interface GetKoloWidgetUrlResponse {
  signedUrl: string;
}

interface KoloWidgetCustomerColors {
  BrandColor?: string;
  ButtonPimary?: string;
  ButtonPimaryDisabled?: string;
  ButtonPimaryPressed?: string;
  TextButton?: string;
  TextDisabledButton?: string;
  BgPrimary?: string;
  BgSecondary?: string;
  BgTertiary?: string;
}

interface GetKoloWidgetUrlParams {
  email?: string;
  isEmailLocked?: boolean;
  themeColor?: 'dark' | 'light';
  currency?: string[];
  language?: string;
  customerColors?: KoloWidgetCustomerColors;
  hideFeatures?: Array<'convert' | 'topup' | 'payout'>;
  isPersist?: boolean;
}

export const getKoloWidgetUrl = async (params: GetKoloWidgetUrlParams) => {
  const url = new URL(EnvVars.KOLO_BASE_URL);

  url.searchParams.set('apiKey', EnvVars.KOLO_API_KEY);

  if (params.email) {
    url.searchParams.set('email', params.email);
  }
  if (typeof params.isEmailLocked === 'boolean') {
    url.searchParams.set('isEmailLocked', String(params.isEmailLocked));
  }
  if (params.themeColor) {
    url.searchParams.set('themeColor', params.themeColor);
  }
  if (params.currency) {
    params.currency.forEach(code => {
      url.searchParams.append('currency', code);
    });
  }
  if (params.language) {
    url.searchParams.set('language', params.language);
  }
  if (params.customerColors) {
    Object.entries(params.customerColors).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });
  }
  if (params.hideFeatures) {
    params.hideFeatures.forEach(feature => {
      url.searchParams.append('hideFeatures', feature);
    });
  }
  if (typeof params.isPersist === 'boolean') {
    url.searchParams.set('isPersist', String(params.isPersist));
  }

  const { data } = await templeWalletApi.post<GetKoloWidgetUrlResponse>('/kolo/widget-sign', {
    urlForSignature: url.toString()
  });

  return data.signedUrl;
};
