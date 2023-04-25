import { toAssetSlug } from 'lib/temple/assets';

import { templeWalletApi } from './templewallet.api';

interface GetExchangeRatesResponseItem {
  tokenAddress?: string;
  tokenId?: number;
  exchangeRate: string;
}

export const fetchUsdToTokenRates = () =>
  templeWalletApi.get<GetExchangeRatesResponseItem[]>('/exchange-rates').then(({ data }) => {
    const prices: Record<string, string> = {};

    for (const { tokenAddress, tokenId, exchangeRate } of data) {
      if (tokenAddress) {
        prices[toAssetSlug(tokenAddress, tokenId)] = exchangeRate;
      } else {
        prices.tez = exchangeRate;
      }
    }

    return prices;
  });
