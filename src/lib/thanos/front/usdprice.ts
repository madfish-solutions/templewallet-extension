import * as React from "react";
import constate from "constate";
import useSWR from "swr";
import { getMarketTickers } from "lib/tzstats";
import { useReadyThanos } from "lib/thanos/front/ready";

export const [USDPriceProvider, useUSDPrice] = constate(() => {
  const mtSWR = useMarketTickers(true);
  const { network } = useReadyThanos();

  return React.useMemo(() => {
    if (!(mtSWR.data && network.type === "main")) {
      return null;
    }

    // Inspiration
    // https://github.com/blockwatch-cc/tzstats/blob/7de49649b795db74f3de817fd5f268a3753b5254/src/components/Layout/Sidebar/MarketInfo/MarketInfo.js#L16

    // filter fresh tickers in USD only (age < 2min)
    const usdTickers = mtSWR.data.filter(
      e => e.quote === "USD" && Date.now() - +new Date(e.timestamp) < 60_000 * 2
    );
    // price index: use all USD ticker last prices with equal weight
    const vol = usdTickers.reduce((s, t) => s + t.volume_base, 0) || null;
    const price =
      vol && usdTickers.reduce((s, t) => s + (t.last * t.volume_base) / vol, 0);

    return price;
  }, [mtSWR.data, network.type]);
});

export function useMarketTickers(suspense?: boolean) {
  return useSWR("market-tickers", getMarketTickers, {
    dedupingInterval: 360_000,
    suspense
  });
}
