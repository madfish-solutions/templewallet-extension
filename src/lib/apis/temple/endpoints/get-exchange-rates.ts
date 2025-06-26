import { TEZ_TOKEN_SLUG, toTokenSlug } from 'lib/assets';

import { templeWalletApi } from './templewallet.api';

interface GetExchangeRatesResponseItem {
  tokenAddress: string;
  tokenId?: number;
  exchangeRate: string;
}

export const fetchTezExchangeRate = () => templeWalletApi.get<number>('/exchange-rates/tez').then(({ data }) => data);

export const fetchUsdToTokenRates = () =>
  templeWalletApi.get<GetExchangeRatesResponseItem[]>('/exchange-rates').then(({ data }) => {
    const prices: StringRecord = {};

    for (const { tokenAddress, tokenId, exchangeRate } of data) {
      if (tokenAddress) {
        prices[toTokenSlug(tokenAddress, tokenId)] = exchangeRate;
      } else {
        prices[TEZ_TOKEN_SLUG] = exchangeRate;
      }
    }

    return prices;
  });

export const fetchBtcToUsdRateRate = () => templeWalletApi.get<number>('/exchange-rates/btc').then(({ data }) => data);
