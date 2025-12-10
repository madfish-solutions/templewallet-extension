import { isDefined } from '@rnw-community/shared';

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

export const getKoloWidgetUrl = async (params: GetKoloWidgetUrlParams = {}) => {
  const { email, isEmailLocked, themeColor, currency, language, customerColors, hideFeatures, isPersist } = params;
  const url = new URL(EnvVars.KOLO_BASE_URL);

  url.searchParams.set('apiKey', EnvVars.KOLO_API_KEY);

  if (email) {
    url.searchParams.set('email', email);
  }

  if (isDefined(isEmailLocked)) {
    url.searchParams.set('isEmailLocked', String(isEmailLocked));
  }

  if (themeColor) {
    url.searchParams.set('themeColor', themeColor);
  }

  currency?.forEach(code => {
    url.searchParams.append('currency', code);
  });

  if (language) {
    url.searchParams.set('language', language);
  }

  Object.entries(customerColors ?? {}).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  hideFeatures?.forEach(feature => {
    url.searchParams.append('hideFeatures', feature);
  });

  if (isDefined(isPersist)) {
    url.searchParams.set('isPersist', String(isPersist));
  }

  const { data } = await templeWalletApi.post<GetKoloWidgetUrlResponse>('/kolo/widget-sign', {
    urlForSignature: url.toString()
  });

  return data.signedUrl;
};
