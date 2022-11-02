import { templeWalletApi } from './templewallet.api';

interface GetMoonpaySignResponse {
  signedUrl: string;
}

export const getMoonpaySign = (url: string) => templeWalletApi.get<GetMoonpaySignResponse>('/moonpay-sign', { url });
