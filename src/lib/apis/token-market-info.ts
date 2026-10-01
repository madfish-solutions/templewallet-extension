import memoizee from 'memoizee';

import { fetchTezosMarkets } from 'lib/apis/temple/endpoints/tezos-markets';
import { fromAssetSlug, isTezAsset, toTokenSlug } from 'lib/assets';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { BasicChain } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { fetchContractUsdVolume, fetchTickerUsdVolume } from './coinpaprika';
import { evmNativeCoinId, paprikaPlatformIdsForChain, TEZOS_PAPRIKA_COIN_ID } from './market-platforms';

interface TokenMarketInfo {
  total_volume: number | null;
}

/**
 * Coinpaprika ids whose ticker endpoint currently returns USD volume.
 * USDt is absent from the Tezos contract index, so it uses the Tether ticker.
 */
const TEZOS_TOKEN_PAPRIKA_IDS: Record<string, string> = {
  [toTokenSlug('KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o', 0)]: 'usdt-tether',
  [toTokenSlug('KT1Ha4yFVeyzw6KRAdkzq6TxDHB97KG4pZe8', 0)]: 'doga-dogam'
};

/** Coingecko ids present in Temple `GET /tezos-markets`, for tokens Coinpaprika does not quote. */
const TEZOS_TOKEN_MARKET_IDS: Record<string, string> = {
  [toTokenSlug('KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o', 0)]: 'tether',
  [toTokenSlug('KT1XRPEPXbZK25r3Htzp2o1x7xdMMmfocKNW', 0)]: 'youves-uusd',
  [toTokenSlug('KT1LSH97386CURN9FgRNqdQJoHaHY6e1vxUv', 0)]: 'vnx-gold',
  [toTokenSlug('KT1LssxZqfQtRFv1CRkzX9E9gzap9iFrtWmq', 0)]: 'vnx-swiss-franc',
  [toTokenSlug('KT1KXKhkxDezoa8G3WvPtsrgNTs5ZQwhpYZN', 0)]: 'stacy-staked-xtz',
  [toTokenSlug('KT1FenS7BCUjn1otfFyfrfxguiGnL4UTF3aG', 0)]: 'vnx-euro',
  [toTokenSlug('KT1LN4LPSqTMS7Sd2CJw4bbDGRkMv2t68Fy9', 0)]: 'usdtez',
  [toTokenSlug('KT1GRSvLoikDsXujKgZPsGLX8k8VvR2Tq95b', 0)]: 'plenty-dao',
  [toTokenSlug('KT193D4vozYnhGJQVtw7CoxxqphqUEEwK6Vb', 0)]: 'quipuswap-governance-token',
  [toTokenSlug('KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV', 0)]: 'kolibri-usd',
  [toTokenSlug('KT1UG6PdaKoJcc3yD6mkFVfxnS1uJeW3cGeX', 1)]: 'wrapped-busd',
  [toTokenSlug('KT1GY5qCWwmESfTv9dgjYyTYs2T5XGDSvRp1', 0)]: 'tezos-domains'
};

const TEZOS_MARKETS_TTL_MS = 60_000;

const paprikaPlatformIds = (chain: BasicChain): string[] => paprikaPlatformIdsForChain(chain.kind, chain.chainId);

const loadTezosMarketVolumes = memoizee(
  async (): Promise<ReadonlyMap<string, number | null>> => {
    const markets = await fetchTezosMarkets();
    const volumes = new Map<string, number | null>();
    for (const market of markets) volumes.set(market.id, market.total_volume);
    return volumes;
  },
  { promise: true, maxAge: TEZOS_MARKETS_TTL_MS }
);

const tezosMarketVolume = async (assetSlug: string): Promise<number | null> => {
  const marketId = TEZOS_TOKEN_MARKET_IDS[assetSlug];
  if (!marketId) return null;

  try {
    const volumes = await loadTezosMarketVolumes();
    return volumes.get(marketId) ?? null;
  } catch {
    return null;
  }
};

const tezosPaprikaVolume = async (assetSlug: string, chain: BasicChain): Promise<number | null> => {
  const coinId = TEZOS_TOKEN_PAPRIKA_IDS[assetSlug];
  if (coinId) {
    const volume = await fetchTickerUsdVolume(coinId);
    if (volume != null) return volume;
  }

  const [contract] = fromAssetSlug(assetSlug);
  const address = contract.toLowerCase();

  for (const platformId of paprikaPlatformIds(chain)) {
    const volume = await fetchContractUsdVolume(platformId, address);
    if (volume != null) return volume;
  }

  return null;
};

export async function fetchTokenMarketInfo(assetSlug: string, chain: BasicChain): Promise<TokenMarketInfo> {
  if (chain.kind === TempleChainKind.Tezos && isTezAsset(assetSlug)) {
    return { total_volume: await fetchTickerUsdVolume(TEZOS_PAPRIKA_COIN_ID) };
  }

  if (chain.kind === TempleChainKind.EVM && isEvmNativeTokenSlug(assetSlug)) {
    const coinId = evmNativeCoinId(chain.chainId);
    return { total_volume: coinId ? await fetchTickerUsdVolume(coinId) : null };
  }

  if (chain.kind === TempleChainKind.Tezos) {
    const paprikaVolume = await tezosPaprikaVolume(assetSlug, chain);
    if (paprikaVolume != null) return { total_volume: paprikaVolume };
    return { total_volume: await tezosMarketVolume(assetSlug) };
  }

  const [contract] = fromAssetSlug(assetSlug);
  const address = contract.toLowerCase();

  for (const platformId of paprikaPlatformIds(chain)) {
    const volume = await fetchContractUsdVolume(platformId, address);
    if (volume !== undefined) return { total_volume: volume };
  }

  return { total_volume: null };
}
