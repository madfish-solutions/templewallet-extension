import axios from 'axios';

import { EnvVars } from 'lib/env';

export enum CurrencyInfoType {
  CRYPTO = 'CRYPTO',
  FIAT = 'FIAT'
}

export interface UtorgCurrencyInfo {
  currency: string;
  symbol: string;
  chain: string;
  display: string;
  caption: string;
  explorerTx: string;
  explorerAddr: string;
  type: CurrencyInfoType;
  enabled: boolean;
  depositMin: number;
  depositMax: number;
  withdrawalMin: number;
  withdrawalMax: number;
  addressValidator: string;
  precision: number;
  allowTag: boolean;
}

const SID = EnvVars.TEMPLE_WALLET_UTORG_SID;

const api = axios.create({
  baseURL: 'https://app.utorg.pro/api/merchant/v1',
  headers: {
    'Content-Type': 'application/json',
    'X-AUTH-SID': SID,
    'X-AUTH-NONCE': Math.random().toString()
  }
});

export const createOrder = (amount: number, paymentCurrency: string, address: string, cryptoCurrency: string) =>
  api
    .post<{ data: { url: string } }>('/order/init', {
      type: 'FIAT_TO_CRYPTO',
      currency: cryptoCurrency,
      amount,
      paymentCurrency,
      address,
      externalId: Number(new Date()).toString() + paymentCurrency + amount.toString()
    })
    .then(r => r.data.data.url);

export async function convertFiatAmountToCrypto(
  fromCurrency: string,
  toCurrency: string,
  fiatAmount: number
): Promise<number>;
export async function convertFiatAmountToCrypto(
  fromCurrency: string,
  toCurrency: string,
  fiatAmount: undefined,
  cryptoAmount: number
): Promise<number>;
export async function convertFiatAmountToCrypto(
  fromCurrency: string,
  toCurrency: string,
  fiatAmount: number | undefined,
  cryptoAmount?: number
): Promise<number> {
  const response = await api.post<{ data: number }>('/tools/convert', {
    fromCurrency,
    paymentAmount: fiatAmount,
    amount: cryptoAmount,
    toCurrency
  });

  return response.data.data;
}

export const getCurrenciesInfo = () =>
  api.post<{ data: UtorgCurrencyInfo[] }>('/settings/currency').then(r => r.data.data);

export const getMinMaxExchangeValue = (currency: string) =>
  getCurrenciesInfo().then(currenciesInfo => {
    const currencyInfo = currenciesInfo.find(currencyInfo => currencyInfo.currency === currency);

    if (currencyInfo == null) throw new Error('Unknown Utorg currency');

    return { minAmount: currencyInfo.depositMin, maxAmount: currencyInfo.depositMax };
  });

export const getAvailableFiatCurrencies = () =>
  getCurrenciesInfo().then(currenciesInfo =>
    currenciesInfo
      .filter(currencyInfo => currencyInfo.type === CurrencyInfoType.FIAT)
      .map(currencyInfo => currencyInfo.currency)
  );
