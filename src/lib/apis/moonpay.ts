import { gql } from '@apollo/client';
import axios from 'axios';
import { map } from 'rxjs';

import { EnvVars } from 'lib/env';

import { getApolloConfigurableClient } from './apollo';

interface Currency {
  id: string;
  name: string;
  code: string;
  icon: string;
  minBuyAmount: number | null;
  maxBuyAmount: number | null;
  precision: number;
}

export interface FiatCurrency extends Currency {
  minBuyAmount: number;
  maxBuyAmount: number;
  lowLimitAmount: number;
}

export interface CryptoCurrency extends Currency {
  networkCode: string;
  supportsLiveMode: boolean;
  isSuspended: boolean;
}

export interface CryptoCurrenciesResponse {
  cryptoCurrencies: CryptoCurrency[];
}

export interface FiatCurrenciesResponse {
  fiatCurrencies: FiatCurrency[];
}

export interface QuoteResponse {
  baseCurrencyAmount: number;
  quoteCurrencyAmount: number;
  extraFeeAmount: number;
  extraFeePercentage: number;
  feeAmount: number;
  networkFeeAmount: number;
  totalAmount: number;
}

export const MOONPAY_DOMAIN = 'https://buy.moonpay.com';
export const MOONPAY_ASSETS_BASE_URL = 'https://static.moonpay.com';
export const MOONPAY_API_KEY = EnvVars.TEMPLE_WALLET_MOONPAY_API_KEY;

const MOONPAY_GRAPHQL_API_URL = 'https://api.moonpay.com/graphql';
const apolloMoonPayClient = getApolloConfigurableClient(MOONPAY_GRAPHQL_API_URL);

const CRYPTO_CURRENCIES_QUERY = gql`
  query cryptoCurrencies($apiKey: String!) {
    cryptoCurrencies(apiKey: $apiKey) {
      id
      name
      code
      icon
      minBuyAmount
      maxBuyAmount
      networkCode
      precision
      supportsLiveMode
      isSuspended
      __typename
    }
  }
`;

const FIAT_CURRENCIES_QUERY = gql`
  query fiatCurrencies($apiKey: String!) {
    fiatCurrencies(apiKey: $apiKey) {
      id
      name
      code
      icon
      precision
      maxBuyAmount
      minBuyAmount
      lowLimitAmount
      __typename
    }
  }
`;

export const fetchMoonpayCryptoCurrencies$ = () =>
  apolloMoonPayClient
    .query<CryptoCurrenciesResponse>(CRYPTO_CURRENCIES_QUERY, { apiKey: MOONPAY_API_KEY })
    .pipe(map(data => data.cryptoCurrencies));

export const fetchMoonpayFiatCurrencies$ = () =>
  apolloMoonPayClient
    .query<FiatCurrenciesResponse>(FIAT_CURRENCIES_QUERY, { apiKey: MOONPAY_API_KEY })
    .pipe(map(data => data.fiatCurrencies));

const moonPayApi = axios.create({ baseURL: 'https://api.moonpay.com' });

export async function getMoonPayBuyQuote(
  cryptoSymbol: string,
  baseCurrencyCode: string,
  baseCurrencyAmount: string | number
) {
  const result = await moonPayApi.get<QuoteResponse>(`/v3/currencies/${cryptoSymbol}/buy_quote`, {
    params: {
      apiKey: MOONPAY_API_KEY,
      baseCurrencyAmount,
      baseCurrencyCode,
      fixed: true,
      areFeesIncluded: true,
      regionalPricing: true
    }
  });

  return result.data;
}
