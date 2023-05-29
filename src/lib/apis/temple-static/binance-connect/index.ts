import { axiosApi } from '../axios-api';
import { GetBinanceConnectCurrenciesResponse } from './types';

export type { GetBinanceConnectCurrenciesResponse };

export const getBinanceConnectCurrencies = () =>
  axiosApi.get<GetBinanceConnectCurrenciesResponse>('/binance-connect/currencies').then(({ data }) => data);

export const estimateBinanceConnectOutput = (inputFiatCode: string, outputCryptoCode: string, inputAmount: string) =>
  axiosApi
    .get<{ outputAmount: number }>('/binance-connect/output', {
      params: { inputFiatCode, outputCryptoCode, inputAmount }
    })
    .then(({ data }) => data.outputAmount);

export const createBinanceConnectTradeOrder = (
  inputFiatCode: string,
  outputCryptoCode: string,
  inputAmount: string,
  accountPkh: string
) =>
  axiosApi
    .post<{ checkoutUrl: string }>('/binance-connect/create-order', null, {
      params: { inputFiatCode, outputCryptoCode, inputAmount, accountPkh }
    })
    .then(({ data }) => data.checkoutUrl);
