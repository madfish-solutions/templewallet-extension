import { firstValueFrom } from 'rxjs';
import { getAddress, isAddress } from 'viem';

import { fetchAssetPlatforms } from 'lib/apis/coingecko';
import { fetchgetRoute3Tokens, type Route3Token } from 'lib/apis/route3/fetch-route3-tokens';
import { getLifiSwapTokens, type TokensByChain } from 'lib/apis/temple/endpoints/evm';
import { toTokenSlug } from 'lib/assets/utils';
import { COMMON_MAINNET_CHAIN_IDS, ETHEREUM_MAINNET_CHAIN_ID, TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { TempleChainKind } from 'temple/types';

import { getCoinPlatforms } from './fetch-coins-by-symbol';
import { persistentCache } from './persistent-cache';

export type ResolvedAsset =
  | { resolved: false }
  | {
      resolved: true;
      swappable: boolean;
      chainKind: TempleChainKind;
      chainId: string;
      contract: string;
      assetSlug: string;
    };

const TEZOS_PLATFORM = 'tezos';

const SUPPORTED_EVM_CHAINS: ReadonlyArray<{ slug: string; chainId: number }> = [
  { slug: 'ethereum', chainId: ETHEREUM_MAINNET_CHAIN_ID },
  { slug: 'binance-smart-chain', chainId: COMMON_MAINNET_CHAIN_IDS.bsc },
  { slug: 'polygon-pos', chainId: COMMON_MAINNET_CHAIN_IDS.polygon },
  { slug: 'arbitrum-one', chainId: COMMON_MAINNET_CHAIN_IDS.arbitrum },
  { slug: 'optimistic-ethereum', chainId: COMMON_MAINNET_CHAIN_IDS.optimism },
  { slug: 'base', chainId: COMMON_MAINNET_CHAIN_IDS.base },
  { slug: 'avalanche', chainId: COMMON_MAINNET_CHAIN_IDS.avalanche },
  { slug: 'rootstock', chainId: COMMON_MAINNET_CHAIN_IDS.rootstock }
];
const SUPPORTED_CHAIN_IDS = SUPPORTED_EVM_CHAINS.map(entry => entry.chainId);

interface SwapLists {
  route3: Route3Token[];
  lifiTokens: TokensByChain;
}

// Swappable-token lists (3Route + Li.Fi), used to decide Swap vs. Buy once the chain is known.
const ensureLists = persistentCache<SwapLists>({
  storageKey: 'WEB_WIDGETS_SWAP_LISTS',
  ttlMs: 6 * 60 * 60 * 1000,
  fallback: { route3: [], lifiTokens: {} },
  build: async () => {
    const [route3, lifiTokens] = await Promise.all([
      firstValueFrom(fetchgetRoute3Tokens()),
      getLifiSwapTokens(SUPPORTED_CHAIN_IDS)
    ]);
    return { route3, lifiTokens };
  },
  // Only cache a build where BOTH lists returned data — an empty result (a failed 3Route or Li.Fi fetch) would
  // otherwise be cached for the full TTL and hide every Swap button. persistentCache retries (30s backoff) instead.
  isValid: ({ route3, lifiTokens }) => route3.length > 0 && Object.keys(lifiTokens).length > 0
});

const isEvmSwappable = (lifiTokens: TokensByChain, chainId: number, contract: string): boolean =>
  (lifiTokens[chainId] ?? []).some(token => token.address && token.address.toLowerCase() === contract.toLowerCase());

interface NativeCoinsInfo {
  /** Native gas coin id → the SUPPORTED Temple chain it's the gas token of (ETH, BNB, POL, AVAX, XTZ…). */
  supported: Record<string, { chainKind: TempleChainKind; chainId: string }>;
  /** Every chain's native coin id (supported or not) — a coin native to an unsupported chain resolves to data-only. */
  allNatives: string[];
}

const ensureNativeGasCoins = persistentCache<NativeCoinsInfo>({
  storageKey: 'WEB_WIDGETS_NATIVE_GAS_COINS_V2',
  ttlMs: 24 * 60 * 60 * 1000,
  fallback: { supported: {}, allNatives: [] },
  build: async () => {
    const platforms = await fetchAssetPlatforms();
    const bySlug = new Map(platforms.map(entry => [entry.id, entry]));
    const supported: Record<string, { chainKind: TempleChainKind; chainId: string }> = {};

    for (const { slug, chainId } of SUPPORTED_EVM_CHAINS) {
      const nativeCoinId = bySlug.get(slug)?.native_coin_id;
      if (nativeCoinId && !supported[nativeCoinId]) {
        supported[nativeCoinId] = { chainKind: TempleChainKind.EVM, chainId: String(chainId) };
      }
    }

    const tezosNativeCoinId = bySlug.get(TEZOS_PLATFORM)?.native_coin_id;
    if (tezosNativeCoinId) {
      supported[tezosNativeCoinId] = { chainKind: TempleChainKind.Tezos, chainId: TEZOS_MAINNET_CHAIN_ID };
    }

    const allNatives = platforms.map(entry => entry.native_coin_id).filter((id): id is string => Boolean(id));

    return { supported, allNatives };
  },
  isValid: ({ supported }) => Object.keys(supported).length > 0
});

export const resolveAsset = async (coinId: string): Promise<ResolvedAsset> => {
  const [nativeCoins, lists, platforms] = await Promise.all([
    ensureNativeGasCoins(),
    ensureLists(),
    getCoinPlatforms(coinId)
  ]);

  // TEMP DEBUG (remove): full decision path for a ticker.
  console.info('[TW-DEBUG resolveAsset]', coinId, {
    platformKeys: Object.keys(platforms),
    platformEthereum: platforms['ethereum'],
    supportedSize: Object.keys(nativeCoins.supported).length,
    allNativesSize: nativeCoins.allNatives.length,
    inSupported: Boolean(nativeCoins.supported[coinId]),
    inAllNatives: nativeCoins.allNatives.includes(coinId),
    lifiChains: Object.keys(lists.lifiTokens),
    lifiEthCount: lists.lifiTokens[1]?.length ?? 0,
    route3Count: lists.route3.length
  });

  // 1. Native gas coin of a supported chain (ETH/BNB/POL/AVAX/XTZ) → Buy target (not swappable to itself).
  const supported = nativeCoins.supported[coinId];
  if (supported) {
    return {
      resolved: true,
      swappable: false,
      chainKind: supported.chainKind,
      chainId: supported.chainId,
      contract: '',
      assetSlug: supported.chainKind === TempleChainKind.Tezos ? 'tez' : 'eth'
    };
  }

  // 2. Coin native to an UNSUPPORTED chain (ATOM→Cosmos, SOL→Solana, ADA→Cardano…) → data-only, so we don't surface
  //    a bridged wrapper (e.g. ATOM's Binance-Peg BSC copy). EXCEPTION: some coins are the native coin of an obscure
  //    chain yet are primarily an Ethereum/Tezos token (USDC/WETH/WBTC) — an Ethereum or Tezos contract means "real
  //    token here", so let those resolve normally. ATOM/SOL/ADA have neither and stay data-only.
  if (nativeCoins.allNatives.includes(coinId) && !platforms['ethereum'] && !platforms[TEZOS_PLATFORM]) {
    return { resolved: false };
  }

  // 3. Token → the first supported chain it has a contract on (Ethereum-first priority).
  for (const { slug, chainId } of SUPPORTED_EVM_CHAINS) {
    const raw = platforms[slug];
    if (!raw) continue;
    const contract = isAddress(raw) ? getAddress(raw) : raw;
    return {
      resolved: true,
      swappable: isEvmSwappable(lists.lifiTokens, chainId, contract),
      chainKind: TempleChainKind.EVM,
      chainId: String(chainId),
      contract,
      assetSlug: toTokenSlug(contract, 0)
    };
  }

  const tezContract = platforms[TEZOS_PLATFORM];
  if (tezContract) {
    const r3 = lists.route3.find(token => token.contract && token.contract.toLowerCase() === tezContract.toLowerCase());
    return {
      resolved: true,
      swappable: Boolean(r3),
      chainKind: TempleChainKind.Tezos,
      chainId: TEZOS_MAINNET_CHAIN_ID,
      contract: tezContract,
      assetSlug: toTokenSlug(tezContract, r3?.tokenId ?? 0)
    };
  }

  return { resolved: false };
};
