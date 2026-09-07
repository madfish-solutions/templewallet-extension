import { TempleChainKind } from 'temple/types';

import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from '../assets/defaults';
import { parseChainAssetSlug, toChainAssetSlug } from '../assets/utils';
import { COMMON_MAINNET_CHAIN_IDS, ETHEREUM_MAINNET_CHAIN_ID, TEZOS_MAINNET_CHAIN_ID } from '../temple/types';

const WERT_ONRAMP_URL = 'https://onramp.templewallet.com';

export const TEZOS_CHAIN_ASSET_SLUG = toChainAssetSlug(TempleChainKind.Tezos, TEZOS_MAINNET_CHAIN_ID, TEZ_TOKEN_SLUG);

interface WertCommodity {
  commodity: string;
  network: string;
}

export const wertCommodityEvmChainIdMap: Record<string | number, WertCommodity> = {
  [ETHEREUM_MAINNET_CHAIN_ID]: { commodity: 'ETH', network: 'ethereum' },
  [COMMON_MAINNET_CHAIN_IDS.bsc]: { commodity: 'BNB', network: 'bsc' },
  [COMMON_MAINNET_CHAIN_IDS.polygon]: { commodity: 'POL', network: 'polygon' },
  [COMMON_MAINNET_CHAIN_IDS.base]: { commodity: 'ETH', network: 'base' },
  [COMMON_MAINNET_CHAIN_IDS.avalanche]: { commodity: 'AVAX', network: 'avalanche' },
  [COMMON_MAINNET_CHAIN_IDS.arbitrum]: { commodity: 'ETH', network: 'arbitrum' },
  [COMMON_MAINNET_CHAIN_IDS.rootstock]: { commodity: 'RBTC', network: 'rootstock' }
};

const TEZOS_WERT_COMMODITY: WertCommodity = {
  commodity: 'XTZ',
  network: 'tezos'
};

export const getWertCommodity = (chainAssetSlug: string): WertCommodity | undefined => {
  if (chainAssetSlug === TEZOS_CHAIN_ASSET_SLUG) return TEZOS_WERT_COMMODITY;

  const [chainKind, chainId, assetSlug] = parseChainAssetSlug(chainAssetSlug);

  if (chainKind !== TempleChainKind.EVM || assetSlug !== EVM_TOKEN_SLUG) return undefined;

  return Object.hasOwn(wertCommodityEvmChainIdMap, chainId) ? wertCommodityEvmChainIdMap[chainId] : undefined;
};

export const isWertSupportedChainAssetSlug = (chainAssetSlug: string) => getWertCommodity(chainAssetSlug) !== undefined;

export const getWertOnRampUrl = (walletAddress: string, { commodity, network }: WertCommodity, amount?: number) => {
  const url = new URL(WERT_ONRAMP_URL);

  url.searchParams.set('commodity', commodity);
  url.searchParams.set('network', network);
  url.searchParams.set('address', walletAddress);
  if (amount) url.searchParams.set('amount', String(amount));

  return url.toString();
};
