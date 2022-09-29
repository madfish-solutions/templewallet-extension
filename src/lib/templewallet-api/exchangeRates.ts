import { templewalletQuery } from './templewallet-query';

type TokensExchangeRatesEntry = {
  tokenAddress?: string;
  tokenId?: number;
  exchangeRate: string;
};

export const getTokensExchangeRates = templewalletQuery<{}, TokensExchangeRatesEntry[]>('GET', '/exchange-rates');
