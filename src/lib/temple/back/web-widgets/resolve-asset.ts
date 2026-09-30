import { firstValueFrom } from 'rxjs';
import { getAddress, isAddress } from 'viem';

import { CONTRACT_MARKET_PLATFORMS, MARKET_PLATFORMS, TEZOS_PLATFORM_SLUG } from 'lib/apis/market-platforms';
import { fetchgetRoute3Tokens, type Route3Token } from 'lib/apis/route3/fetch-route3-tokens';
import { getLifiSwapTokens, type TokensByChain } from 'lib/apis/temple/endpoints/evm';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { toTokenSlug } from 'lib/assets/utils';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { equalsIgnoreCase } from 'lib/utils';
import { ONE_HOUR_MS } from 'lib/utils/numbers';
import { TempleChainKind } from 'temple/types';

import { getCoinById, getCoinPlatforms, type PlatformDeployment } from './fetch-coins-by-symbol';
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

const SWAP_LISTS_TTL_MS = 6 * ONE_HOUR_MS;

const EVM_CHAIN_ID_BY_PLATFORM_SLUG = new Map<string, number>();

for (const platform of CONTRACT_MARKET_PLATFORMS) {
  if (
    platform.chainKind === 'evm' &&
    typeof platform.chainId === 'number' &&
    !EVM_CHAIN_ID_BY_PLATFORM_SLUG.has(platform.slug)
  ) {
    EVM_CHAIN_ID_BY_PLATFORM_SLUG.set(platform.slug, platform.chainId);
  }
}

const SUPPORTED_CHAIN_IDS = Array.from(EVM_CHAIN_ID_BY_PLATFORM_SLUG.values());

interface SwapLists {
  route3: Route3Token[];
  lifiTokens: TokensByChain;
}

const ensureLists = persistentCache<SwapLists>({
  storageKey: 'WEB_WIDGETS_SWAP_LISTS',
  ttlMs: SWAP_LISTS_TTL_MS,
  fallback: { route3: [], lifiTokens: {} },
  build: async () => {
    const [route3, lifiTokens] = await Promise.all([
      firstValueFrom(fetchgetRoute3Tokens()),
      getLifiSwapTokens(SUPPORTED_CHAIN_IDS)
    ]);
    return { route3, lifiTokens };
  },
  isValid: ({ route3, lifiTokens }) => route3.length > 0 && Object.keys(lifiTokens).length > 0
});

const isEvmSwappable = (lifiTokens: TokensByChain, chainId: number, contract: string): boolean =>
  (lifiTokens[chainId] ?? []).some(token => Boolean(token.address) && equalsIgnoreCase(token.address, contract));

const toTempleChainKind = (kind: 'evm' | 'tezos'): TempleChainKind =>
  kind === 'tezos' ? TempleChainKind.Tezos : TempleChainKind.EVM;

const supportedNativeCoins: Record<string, { chainKind: TempleChainKind; chainId: string }> = {};

for (const platform of CONTRACT_MARKET_PLATFORMS) {
  if (platform.chainKind === 'other' || platform.chainId == null || supportedNativeCoins[platform.nativeCoinId])
    continue;
  supportedNativeCoins[platform.nativeCoinId] = {
    chainKind: toTempleChainKind(platform.chainKind),
    chainId: String(platform.chainId)
  };
}

const supportedNativeCoinIds = new Set(Object.keys(supportedNativeCoins));
const otherNativeCoinIds = new Set(
  MARKET_PLATFORMS.flatMap(platform =>
    supportedNativeCoinIds.has(platform.nativeCoinId) ? [] : [platform.nativeCoinId]
  )
);

const toEvmAsset = (chainId: number, contract: string, swappable: boolean): ResolvedAsset => ({
  resolved: true,
  swappable,
  chainKind: TempleChainKind.EVM,
  chainId: String(chainId),
  contract,
  assetSlug: toTokenSlug(contract, 0)
});

const toTezosAsset = (contract: string, r3: Route3Token | undefined): ResolvedAsset => ({
  resolved: true,
  swappable: Boolean(r3),
  chainKind: TempleChainKind.Tezos,
  chainId: TEZOS_MAINNET_CHAIN_ID,
  contract,
  assetSlug: toTokenSlug(contract, r3?.tokenId ?? 0)
});

export const resolveAsset = async (coinId: string): Promise<ResolvedAsset> => {
  const [lists, platforms, coin] = await Promise.all([ensureLists(), getCoinPlatforms(coinId), getCoinById(coinId)]);

  const supported = supportedNativeCoins[coinId];
  if (supported) {
    return {
      resolved: true,
      swappable: false,
      chainKind: supported.chainKind,
      chainId: supported.chainId,
      contract: '',
      assetSlug: supported.chainKind === TempleChainKind.Tezos ? TEZ_TOKEN_SLUG : EVM_TOKEN_SLUG
    };
  }

  const findPlatform = (slug: string) =>
    platforms.find((deployment: PlatformDeployment) => deployment.slug === slug)?.address;

  if (otherNativeCoinIds.has(coinId) && !findPlatform('ethereum') && !findPlatform(TEZOS_PLATFORM_SLUG)) {
    return { resolved: false };
  }

  const evmDeployments = platforms.flatMap(({ slug, address }) => {
    const chainId = EVM_CHAIN_ID_BY_PLATFORM_SLUG.get(slug);
    if (chainId == null) return [];
    const contract = isAddress(address) ? getAddress(address) : address;
    return [{ chainId, contract }];
  });

  const tezContract = findPlatform(TEZOS_PLATFORM_SLUG);
  const tezMatches = tezContract
    ? lists.route3.filter(
        token => Boolean(token.contract) && equalsIgnoreCase(token.contract ?? undefined, tezContract)
      )
    : [];
  const tezRoute3 = tezMatches.find(token => coin && equalsIgnoreCase(token.symbol, coin.symbol)) ?? tezMatches[0];

  // Resolution rules prefer a swappable deployment over plain chain priority.
  const swappableEvm = evmDeployments.find(({ chainId, contract }) =>
    isEvmSwappable(lists.lifiTokens, chainId, contract)
  );
  if (swappableEvm) return toEvmAsset(swappableEvm.chainId, swappableEvm.contract, true);
  if (tezContract && tezRoute3) return toTezosAsset(tezContract, tezRoute3);

  const [firstEvm] = evmDeployments;
  if (firstEvm) return toEvmAsset(firstEvm.chainId, firstEvm.contract, false);
  if (tezContract) return toTezosAsset(tezContract, undefined);

  return { resolved: false };
};
