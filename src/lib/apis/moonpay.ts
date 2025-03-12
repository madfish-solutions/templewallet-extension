import axios from 'axios';

import { EnvVars } from 'lib/env';

export enum CurrencyType {
  Fiat = 'fiat',
  Crypto = 'crypto'
}

interface CurrencyBase {
  type: CurrencyType;
  id: string;
  code: string;
  name: string;
  precision: number;
  minBuyAmount: number | null;
  maxBuyAmount: number | null;
}

export interface FiatCurrency extends CurrencyBase {
  type: CurrencyType.Fiat;
  minBuyAmount: number;
  maxBuyAmount: number;
  isSellSupported: boolean;
  /** @deprecated */
  minAmount: number;
  /** @deprecated */
  maxAmount: number;
}

export interface CryptoCurrency extends CurrencyBase {
  type: CurrencyType.Crypto;
  metadata: {
    contractAddress: string | null;
    chainId: string | null;
    networkCode: string;
  };
  supportsLiveMode: boolean;
  isSuspended: boolean;
}

export type Currency = FiatCurrency | CryptoCurrency;

interface QuoteResponse {
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
