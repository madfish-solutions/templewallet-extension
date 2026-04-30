import { toTokenSlug } from 'lib/assets/utils';
import { ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { TempleChainKind } from 'temple/types';

import {
  BTC_ASSET,
  EVM_CHAIN_CONFIGS,
  EVM_TOKEN_SLUG,
  EvmChainConfig,
  TEZOS_USDT,
  TEZOS_XTZ,
  iconForExolix
} from './config';
import { BTC_CHAIN_ASSET_SLUG } from './constants';
import { CrossChainAsset } from './types';

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

const requireEvmAsset = (chainId: number, predicate: (a: CrossChainAsset) => boolean, label: string): CrossChainAsset => {
  const found = FALLBACK_EVM_ASSETS.find(a => a.chainId === chainId && predicate(a));
  if (!found) throw new Error(`Cross-chain config missing required asset: ${label} (chainId=${chainId})`);
  return found;
};

export const CROSS_CHAIN_ASSETS = {
  TEZOS_XTZ,
  TEZOS_USDT,
  ETH_NATIVE: requireEvmAsset(ETHEREUM_MAINNET_CHAIN_ID, a => a.assetSlug === EVM_TOKEN_SLUG, 'ETH_NATIVE'),
  ETH_USDT: requireEvmAsset(ETHEREUM_MAINNET_CHAIN_ID, a => a.exolixCoin === 'USDT', 'ETH_USDT'),
  ETH_USDC: requireEvmAsset(ETHEREUM_MAINNET_CHAIN_ID, a => a.exolixCoin === 'USDC', 'ETH_USDC'),
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
