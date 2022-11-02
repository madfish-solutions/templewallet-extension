import { useMemo } from 'react';

import constate from 'constate';

import { useRetryableSWR } from 'lib/swr';
import { getExchangeRates } from 'lib/templewallet-api';

export function useAssetUSDPrice(slug: string) {
  const prices = useUSDPrices();

  return useMemo(() => {
    const rawValue = prices[slug];
    return rawValue ? Number(rawValue) : null;
  }, [slug, prices]);
}

export const [USDPriceProvider, useUSDPrices] = constate((params: { suspense?: boolean }) => {
  const { data } = useRetryableSWR('usd-prices', getExchangeRates, {
    refreshInterval: 5 * 60 * 1_000,
    dedupingInterval: 30_000,
    suspense: params.suspense
  });
  return data ?? {};
});
