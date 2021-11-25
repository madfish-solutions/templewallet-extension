import { useMemo } from 'react';

import constate from 'constate';

import { useRetryableSWR } from 'lib/swr';
import { toTokenSlug } from 'lib/temple/front';
import { getTokensExchangeRates } from 'lib/templewallet-api';

export function useAssetUSDPrice(slug: string) {
  const prices = useUSDPrices();

  return useMemo(() => {
    const rawValue = prices[slug];
    return rawValue ? Number(rawValue) : null;
  }, [slug, prices]);
}

export const [USDPriceProvider, useUSDPrices] = constate((params: { suspense?: boolean }) => {
  const { data } = useRetryableSWR('usd-prices', fetchUSDPrices, {
    refreshInterval: 5 * 60 * 1_000,
    dedupingInterval: 30_000,
    suspense: params.suspense
  });
  return data ?? {};
});

async function fetchUSDPrices() {
  const prices: Record<string, string> = {};

  try {
    const rates = await getTokensExchangeRates({});
    for (const { tokenAddress, tokenId, exchangeRate } of rates) {
      if (tokenAddress) {
        prices[toTokenSlug(tokenAddress, tokenId)] = exchangeRate;
      } else {
        prices.tez = exchangeRate;
      }
    }
  } catch {}

  return prices;
}
