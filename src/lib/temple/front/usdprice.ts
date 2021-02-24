import * as React from "react";
import constate from "constate";
import { useRetryableSWR } from "lib/swr";
import { getMarketTickers } from "lib/tzstats";
import { useNetwork } from "lib/temple/front/ready";

const LIQUIDITY_INTERVAL = 120_000;

export const [USDPriceProvider, useUSDPrice] = constate(() => {
  const mtSWR = useMarketTickers(true);
  const network = useNetwork();

  return React.useMemo(() => {
    if (!(mtSWR.data && network.type === "main")) {
      return null;
    }

    const { tickers, fetchedAt } = mtSWR.data;

    // Inspiration
    // https://github.com/blockwatch-cc/tzstats/blob/7de49649b795db74f3de817fd5f268a3753b5254/src/components/Layout/Sidebar/MarketInfo/MarketInfo.js#L16

    // filter fresh tickers in USD only (age < 2min)
    const usdTickers = tickers.filter(
      (e) =>
        e.quote === "USD" &&
        fetchedAt - +new Date(e.timestamp) < LIQUIDITY_INTERVAL
    );
    // price index: use all USD ticker last prices with equal weight
    const vol = usdTickers.reduce((s, t) => s + t.volume_base, 0) || null;
    const price =
      vol && usdTickers.reduce((s, t) => s + (t.last * t.volume_base) / vol, 0);

    return price;
  }, [mtSWR.data, network.type]);
});

export function useMarketTickers(suspense?: boolean) {
  return useRetryableSWR("market-tickers", fetchMarketTickers, {
    refreshInterval: 60_000,
    dedupingInterval: 30_000,
    suspense,
  });
}

async function fetchMarketTickers() {
  const fetchedAt = Date.now();
  const tickers = await getMarketTickers();
  return { tickers, fetchedAt };
}
