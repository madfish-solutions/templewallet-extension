import { templewalletQuery } from './templewallet-query';
import { TokensExchangeRatesEntry } from './types';

export const getTokensExchangeRates = templewalletQuery<{}, TokensExchangeRatesEntry[]>('GET', '/exchange-rates');
