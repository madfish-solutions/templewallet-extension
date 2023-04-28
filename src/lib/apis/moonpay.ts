import axios from 'axios';

import { EnvVars } from 'lib/env';

export enum CurrencyType {
  Fiat = 'fiat',
  Crypto = 'crypto'
}

interface CurrencyBase {
  id: string;
  name: string;
  code: string;
  minBuyAmount: number | null;
  maxBuyAmount: number | null;
  precision: number;
  type: CurrencyType;
}

export interface FiatCurrency extends CurrencyBase {
  minBuyAmount: number;
  maxBuyAmount: number;
  type: CurrencyType.Fiat;
  lowLimitAmount: number;
}

export interface CryptoCurrency extends CurrencyBase {
  type: CurrencyType.Crypto;
  metadata: {
    contractAddress: string | null;
    coinType: string | null;
    networkCode: string;
  };
  supportsLiveMode: boolean;
  isSuspended: boolean;
}

export type Currency = FiatCurrency | CryptoCurrency;

export interface QuoteResponse {
  baseCurrencyAmount: number;
  quoteCurrencyAmount: number;
  extraFeeAmount: number;
  extraFeePercentage: number;
  feeAmount: number;
  networkFeeAmount: number;
  totalAmount: number;
  baseCurrency: FiatCurrency;
  quoteCurrency: CryptoCurrency;
}

export const MOONPAY_DOMAIN = 'https://buy.moonpay.com';
export const MOONPAY_ASSETS_BASE_URL = 'https://static.moonpay.com';
export const MOONPAY_API_KEY = EnvVars.TEMPLE_WALLET_MOONPAY_API_KEY;

const moonPayApi = axios.create({ baseURL: 'https://api.moonpay.com' });

export async function getMoonPayCurrencies() {
  const result = await moonPayApi.get<Currency[]>('/v3/currencies', {
    params: {
      apiKey: MOONPAY_API_KEY
    }
  });

  return result.data;
}

export async function getMoonPayBuyQuote(
  cryptoSymbol: string,
  baseCurrencyCode: string,
  baseCurrencyAmount: string | number
): Promise<QuoteResponse>;
export async function getMoonPayBuyQuote(
  cryptoSymbol: string,
  baseCurrencyCode: string,
  baseCurrencyAmount: undefined,
  quoteCurrencyAmount: string | number
): Promise<QuoteResponse>;
export async function getMoonPayBuyQuote(
  cryptoSymbol: string,
  baseCurrencyCode: string,
  baseCurrencyAmount: string | number | undefined,
  quoteCurrencyAmount?: string | number
) {
  const result = await moonPayApi.get<QuoteResponse>(`/v3/currencies/${cryptoSymbol}/buy_quote`, {
    params: {
      apiKey: MOONPAY_API_KEY,
      baseCurrencyAmount,
      quoteCurrencyAmount,
      baseCurrencyCode,
      fixed: true,
      areFeesIncluded: true,
      regionalPricing: true
    }
  });

  return result.data;
}
