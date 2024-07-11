import { TEZ_TOKEN_SLUG, toTokenSlug } from 'lib/assets';

import { BTC_TOKEN_SLUG } from '../../../assets/defaults';

import { templeWalletApi } from './templewallet.api';

interface GetExchangeRatesResponseItem {
  tokenAddress: string;
  tokenId?: number;
  exchangeRate: string;
}

export const fetchUsdToTokenRates = () =>
  templeWalletApi.get<GetExchangeRatesResponseItem[]>('/exchange-rates').then(({ data }) => {
    const prices: StringRecord = {};

    for (const { tokenAddress, tokenId, exchangeRate } of data) {
      if (tokenAddress === TEZ_TOKEN_SLUG) {
        prices[TEZ_TOKEN_SLUG] = exchangeRate;
      } else if (tokenAddress === BTC_TOKEN_SLUG) {
        prices[BTC_TOKEN_SLUG] = exchangeRate;
      } else {
        prices[toTokenSlug(tokenAddress, tokenId)] = exchangeRate;
      }
    }

    return prices;
  });
