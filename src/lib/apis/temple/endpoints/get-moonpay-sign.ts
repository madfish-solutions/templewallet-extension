import { stringify } from 'qs';

import { MOONPAY_API_KEY, MOONPAY_DOMAIN } from 'lib/apis/moonpay';

import { templeWalletApi } from './templewallet.api';

interface GetMoonpaySignResponse {
  signedUrl: string;
}

export const getMoonpaySign = async (
  currencyCode?: string,
  colorCode?: string,
  walletAddress?: string,
  baseCurrencyAmount?: string | number,
  baseCurrencyCode?: string
) => {
  const queryParams = stringify({
    apiKey: MOONPAY_API_KEY,
    currencyCode,
    colorCode,
    walletAddress,
    baseCurrencyAmount,
    baseCurrencyCode
  });
  const url = `${MOONPAY_DOMAIN}?${queryParams}`;
  const result = await templeWalletApi.get<GetMoonpaySignResponse>('/moonpay-sign', { params: { url } });

  return result.data.signedUrl;
};
