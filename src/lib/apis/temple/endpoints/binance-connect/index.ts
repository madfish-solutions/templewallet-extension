import { templeWalletApi } from '../templewallet.api';
import { GetBinanceConnectCurrenciesResponse } from './types';

export type { GetBinanceConnectCurrenciesResponse };

export const getBinanceConnectCurrencies = () =>
  templeWalletApi.get<GetBinanceConnectCurrenciesResponse>('/binance-connect/currencies').then(({ data }) => data);

export const estimateBinanceConnectOutput = (inputFiatCode: string, outputCryptoCode: string, inputAmount: string) =>
  templeWalletApi
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
  templeWalletApi
    .post<{ checkoutUrl: string }>('/binance-connect/create-order', null, {
      params: { inputFiatCode, outputCryptoCode, inputAmount, accountPkh }
    })
    .then(({ data }) => data.checkoutUrl);
