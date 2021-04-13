import axios from "axios";
import constate from "constate";

import { useRetryableSWR } from "lib/swr";

const TEZOS_USD_PRICE_ENDPOINT =
  "https://api.coingecko.com/api/v3/simple/price?ids=tezos&vs_currencies=usd";

export const [USDPriceProvider, useUSDPrice] = constate(() => {
  const { data } = useTezosUSDPrice();
  return data ?? null;
});

export function useTezosUSDPrice(suspense?: boolean) {
  return useRetryableSWR("tezos-usd-price", fetchUSDPrice, {
    refreshInterval: 60_000,
    dedupingInterval: 30_000,
    suspense,
  });
}

async function fetchUSDPrice(): Promise<number | null> {
  try {
    const coinGeckoPrice = await axios.get(TEZOS_USD_PRICE_ENDPOINT);
    return coinGeckoPrice.data.tezos.usd ?? null;
  } catch {
    return null;
  }
}
