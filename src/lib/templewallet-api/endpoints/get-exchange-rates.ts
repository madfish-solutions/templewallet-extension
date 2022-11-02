import { toTokenSlug } from 'lib/temple/assets';

import { templeWalletApi } from './templewallet.api';

interface GetExchangeRatesResponseItem {
  tokenAddress?: string;
  tokenId?: number;
  exchangeRate: string;
}

export const getExchangeRates = () =>
  templeWalletApi
    .get<GetExchangeRatesResponseItem[]>('/exchange-rates')
    .then(response => {
      const prices: Record<string, string> = {};

      for (const { tokenAddress, tokenId, exchangeRate } of response.data) {
        if (tokenAddress) {
          prices[toTokenSlug(tokenAddress, tokenId)] = exchangeRate;
        } else {
          prices.tez = exchangeRate;
        }
      }

      return prices;
    })
    .catch(() => ({}));
