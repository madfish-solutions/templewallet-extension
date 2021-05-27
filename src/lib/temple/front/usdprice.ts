import { useMemo } from "react";

import axios from "axios";
import constate from "constate";

import { useRetryableSWR } from "lib/swr";
import { TempleAsset, TempleAssetType } from "lib/temple/front";
import { getTokensExchangeRates } from "lib/templewallet-api";

const TEZOS_USD_PRICE_ENDPOINT =
  "https://api.coingecko.com/api/v3/simple/price?ids=tezos&vs_currencies=usd";

export const [USDPriceProvider, useUSDPrices] = constate(() => {
  const { data: tezPrice } = useTezosUSDPrice();
  const { data: tokensUsdPrices } = useTokensUSDPrices();

  return {
    tezPrice: tezPrice ?? null,
    tokensUsdPrices,
  };
});

export function useAssetUSDPrice(asset: TempleAsset) {
  const { tezPrice, tokensUsdPrices } = useUSDPrices();

  return useMemo(() => {
    if (asset.type === TempleAssetType.TEZ) {
      return tezPrice;
    }
    if (!tokensUsdPrices) {
      return null;
    }
    const rawValue = tokensUsdPrices.find(
      ({ tokenAddress, tokenId }) =>
        tokenAddress === asset.address &&
        (asset.type !== TempleAssetType.FA2 || tokenId === asset.id)
    )?.exchangeRate;
    return rawValue ? Number(rawValue) : null;
  }, [asset, tezPrice, tokensUsdPrices]);
}

function useTokensUSDPrices(suspense?: boolean) {
  return useRetryableSWR("tokens-usd-prices", getTokensExchangeRates, {
    refreshInterval: 15 * 60 * 1000,
    dedupingInterval: 30_000,
    suspense,
  });
}

function useTezosUSDPrice(suspense?: boolean) {
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
