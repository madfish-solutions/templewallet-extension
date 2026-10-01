import { TempleChainKind } from 'temple/types';

import marketPlatforms from './market-platforms.json';

interface MarketPlatform {
  /** Platform slug shared with Temple asset platforms. */
  slug: string;
  paprikaPlatformId: string;
  /** Paprika id of the chain gas token. L2s that use ETH point at eth-ethereum. */
  nativeCoinId: string;
  chainKind: 'evm' | 'tezos' | 'other';
  chainId: number | string | null;
  /** Load token contracts for the web widget. Other rows exist only to recognize native coins. */
  fetchContracts: boolean;
}

const toChainKind = (value: string): MarketPlatform['chainKind'] => {
  if (value === 'evm' || value === 'tezos' || value === 'other') return value;
  throw new Error(`Unknown market platform chain kind: ${value}`);
};

export const MARKET_PLATFORMS: readonly MarketPlatform[] = marketPlatforms.map(platform => ({
  ...platform,
  chainKind: toChainKind(platform.chainKind)
}));

const tezosPlatform = MARKET_PLATFORMS.find(platform => platform.chainKind === 'tezos' && platform.fetchContracts);

if (!tezosPlatform) throw new Error('Tezos market platform is missing');

export const TEZOS_PLATFORM_SLUG = tezosPlatform.slug;
export const TEZOS_PAPRIKA_PLATFORM_ID = tezosPlatform.paprikaPlatformId;
export const TEZOS_PAPRIKA_COIN_ID = tezosPlatform.nativeCoinId;

export const CONTRACT_MARKET_PLATFORMS = MARKET_PLATFORMS.filter(platform => platform.fetchContracts);

export const paprikaPlatformIdsForChain = (kind: TempleChainKind, chainId: number | string): string[] =>
  MARKET_PLATFORMS.flatMap(platform => {
    const kindMatches = kind === TempleChainKind.Tezos ? platform.chainKind === 'tezos' : platform.chainKind === 'evm';
    return kindMatches && platform.chainId === chainId ? [platform.paprikaPlatformId] : [];
  });

export const evmNativeCoinId = (chainId: number): string | undefined =>
  MARKET_PLATFORMS.find(platform => platform.chainKind === 'evm' && platform.chainId === chainId)?.nativeCoinId;
