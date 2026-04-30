import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { toTokenSlug } from 'lib/assets/utils';
import { KNOWN_TOKENS_SLUGS } from 'lib/assets/known-tokens';
import {
  ETHEREUM_MAINNET_CHAIN_ID,
  TEZOS_MAINNET_CHAIN_ID,
  COMMON_MAINNET_CHAIN_IDS
} from 'lib/temple/types';
import { TempleChainKind } from 'temple/types';

import { BTC_CHAIN_ASSET_SLUG, BTC_EXOLIX_COIN_CODE, BTC_EXOLIX_NETWORK_CODE } from './constants';
import { CrossChainAsset } from './types';

interface EvmChainConfig {
  chainId: number;
  exolixNetwork: string;
  networkDisplayName: string;
  nativeCoin: string;
  nativeSymbol: string;
  nativeName: string;
  nativeDecimals: number;
  usdt?: { contract: string; decimals: number };
  usdc?: { contract: string; decimals: number };
}

const EVM_CHAIN_CONFIGS: EvmChainConfig[] = [
  {
    chainId: ETHEREUM_MAINNET_CHAIN_ID,
    exolixNetwork: 'ETH',
    networkDisplayName: 'Ethereum',
    nativeCoin: 'ETH',
    nativeSymbol: 'ETH',
    nativeName: 'Ethereum',
    nativeDecimals: 18,
    usdt: { contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    usdc: { contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 }
  },
  {
    chainId: COMMON_MAINNET_CHAIN_IDS.bsc,
    exolixNetwork: 'BSC',
    networkDisplayName: 'BNB Smart Chain',
    nativeCoin: 'BNB',
    nativeSymbol: 'BNB',
    nativeName: 'BNB',
    nativeDecimals: 18,
    usdt: { contract: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
    usdc: { contract: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 }
  },
  {
    chainId: COMMON_MAINNET_CHAIN_IDS.polygon,
    exolixNetwork: 'MATIC',
    networkDisplayName: 'Polygon',
    nativeCoin: 'POL',
    nativeSymbol: 'POL',
    nativeName: 'Polygon',
    nativeDecimals: 18,
    usdt: { contract: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
    usdc: { contract: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 }
  },
  {
    chainId: COMMON_MAINNET_CHAIN_IDS.arbitrum,
    exolixNetwork: 'ARBITRUM',
    networkDisplayName: 'Arbitrum One',
    nativeCoin: 'ETH',
    nativeSymbol: 'ETH',
    nativeName: 'Arbitrum Ether',
    nativeDecimals: 18,
    usdt: { contract: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
    usdc: { contract: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 }
  },
  {
    chainId: COMMON_MAINNET_CHAIN_IDS.optimism,
    exolixNetwork: 'OPTIMISM',
    networkDisplayName: 'Optimism',
    nativeCoin: 'ETH',
    nativeSymbol: 'ETH',
    nativeName: 'Optimism Ether',
    nativeDecimals: 18,
    usdt: { contract: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6 },
    usdc: { contract: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6 }
  },
  {
    chainId: COMMON_MAINNET_CHAIN_IDS.avalanche,
    exolixNetwork: 'AVAXC',
    networkDisplayName: 'Avalanche',
    nativeCoin: 'AVAX',
    nativeSymbol: 'AVAX',
    nativeName: 'Avalanche',
    nativeDecimals: 18,
    usdt: { contract: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', decimals: 6 },
    usdc: { contract: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6 }
  },
  {
    chainId: COMMON_MAINNET_CHAIN_IDS.base,
    exolixNetwork: 'BASE',
    networkDisplayName: 'Base',
    nativeCoin: 'ETH',
    nativeSymbol: 'ETH',
    nativeName: 'Base Ether',
    nativeDecimals: 18,
    usdc: { contract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 }
  }
];

const iconForExolix = (code: string) => `https://exolix.com/icons/coins/${code}.png`;

const TEZOS_XTZ: CrossChainAsset = {
  dest: 'tezos',
  chainKind: TempleChainKind.Tezos,
  chainId: TEZOS_MAINNET_CHAIN_ID,
  assetSlug: TEZ_TOKEN_SLUG,
  exolixCoin: 'XTZ',
  exolixNetwork: 'XTZ',
  symbol: 'XTZ',
  decimals: 6,
  name: 'Tezos',
  iconUrl: iconForExolix('XTZ')
};

const TEZOS_USDT: CrossChainAsset = {
  dest: 'tezos',
  chainKind: TempleChainKind.Tezos,
  chainId: TEZOS_MAINNET_CHAIN_ID,
  assetSlug: KNOWN_TOKENS_SLUGS.USDT,
  exolixCoin: 'USDT',
  exolixNetwork: 'XTZ',
  symbol: 'USDT',
  decimals: 6,
  name: 'Tether USD (Tezos)',
  iconUrl: iconForExolix('USDT')
};

const BTC_ASSET: CrossChainAsset = {
  dest: 'btc',
  exolixCoin: BTC_EXOLIX_COIN_CODE,
  exolixNetwork: BTC_EXOLIX_NETWORK_CODE,
  symbol: 'BTC',
  decimals: 8,
  name: 'Bitcoin',
  iconUrl: iconForExolix('BTC')
};

export type ExolixNetworksOverride = Record<number, string | undefined>;

const resolveNetwork = (config: EvmChainConfig, override?: ExolixNetworksOverride): string =>
  override?.[config.chainId] ?? config.exolixNetwork;

const buildEvmAssets = (config: EvmChainConfig, override?: ExolixNetworksOverride): CrossChainAsset[] => {
  const exolixNetwork = resolveNetwork(config, override);
  const assets: CrossChainAsset[] = [
    {
      dest: 'evm',
      chainKind: TempleChainKind.EVM,
      chainId: config.chainId,
      assetSlug: EVM_TOKEN_SLUG,
      exolixCoin: config.nativeCoin,
      exolixNetwork,
      symbol: config.nativeSymbol,
      decimals: config.nativeDecimals,
      name: `${config.nativeName} (${config.networkDisplayName})`,
      iconUrl: iconForExolix(config.nativeCoin)
    }
  ];

  if (config.usdt) {
    assets.push({
      dest: 'evm',
      chainKind: TempleChainKind.EVM,
      chainId: config.chainId,
      assetSlug: toTokenSlug(config.usdt.contract, 0),
      exolixCoin: 'USDT',
      exolixNetwork,
      symbol: 'USDT',
      decimals: config.usdt.decimals,
      name: `Tether USD (${config.networkDisplayName})`,
      iconUrl: iconForExolix('USDT')
    });
  }

  if (config.usdc) {
    assets.push({
      dest: 'evm',
      chainKind: TempleChainKind.EVM,
      chainId: config.chainId,
      assetSlug: toTokenSlug(config.usdc.contract, 0),
      exolixCoin: 'USDC',
      exolixNetwork,
      symbol: 'USDC',
      decimals: config.usdc.decimals,
      name: `USD Coin (${config.networkDisplayName})`,
      iconUrl: iconForExolix('USDC')
    });
  }

  return assets;
};

const buildEvmAssetsAll = (override?: ExolixNetworksOverride): CrossChainAsset[] =>
  EVM_CHAIN_CONFIGS.flatMap(config => buildEvmAssets(config, override));

const FALLBACK_EVM_ASSETS: CrossChainAsset[] = buildEvmAssetsAll();

const ETH_NATIVE = FALLBACK_EVM_ASSETS.find(
  a => a.chainId === ETHEREUM_MAINNET_CHAIN_ID && a.assetSlug === EVM_TOKEN_SLUG
)!;
const ETH_USDT = FALLBACK_EVM_ASSETS.find(a => a.chainId === ETHEREUM_MAINNET_CHAIN_ID && a.exolixCoin === 'USDT')!;
const ETH_USDC = FALLBACK_EVM_ASSETS.find(a => a.chainId === ETHEREUM_MAINNET_CHAIN_ID && a.exolixCoin === 'USDC')!;

export const CROSS_CHAIN_ASSETS = {
  TEZOS_XTZ,
  TEZOS_USDT,
  ETH_NATIVE,
  ETH_USDT,
  ETH_USDC,
  BTC: BTC_ASSET
};

const TEZOS_FROM_ASSETS: CrossChainAsset[] = [TEZOS_XTZ, TEZOS_USDT];

export const getAllowedFromAssets = (override?: ExolixNetworksOverride): CrossChainAsset[] => [
  ...TEZOS_FROM_ASSETS,
  ...buildEvmAssetsAll(override)
];

export const getAllowedToAssets = (from: CrossChainAsset, override?: ExolixNetworksOverride): CrossChainAsset[] => {
  if (from.dest === 'tezos') return [...buildEvmAssetsAll(override), BTC_ASSET];
  if (from.dest === 'evm') return [...TEZOS_FROM_ASSETS, BTC_ASSET];
  return [];
};

export const toCrossChainAssetSlug = (asset: CrossChainAsset): string => {
  if (asset.dest === 'btc') return BTC_CHAIN_ASSET_SLUG;
  return `${asset.chainKind}:${asset.chainId}:${asset.assetSlug}`;
};

export const isPairAllowed = (
  from: CrossChainAsset,
  to: CrossChainAsset,
  override?: ExolixNetworksOverride
): boolean => getAllowedToAssets(from, override).some(t => toCrossChainAssetSlug(t) === toCrossChainAssetSlug(to));
