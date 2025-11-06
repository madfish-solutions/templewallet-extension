import { TempleChainKind } from 'temple/types';

import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from '../assets/defaults';
import { parseChainAssetSlug, toChainAssetSlug } from '../assets/utils';
import { COMMON_MAINNET_CHAIN_IDS, ETHEREUM_MAINNET_CHAIN_ID, TEZOS_MAINNET_CHAIN_ID } from '../temple/types';

import { templeWalletApi } from './temple';

const BASE_URL = 'https://widget.wert.io/01H28HR1AXVTAD3AXW3DDFDY2Y/widget';

export const TEZOS_CHAIN_ASSET_SLUG = toChainAssetSlug(TempleChainKind.Tezos, TEZOS_MAINNET_CHAIN_ID, TEZ_TOKEN_SLUG);

const WERT_SUPPORTED_EVM_CHAIN_IDS = [
  ETHEREUM_MAINNET_CHAIN_ID,
  COMMON_MAINNET_CHAIN_IDS.bsc,
  COMMON_MAINNET_CHAIN_IDS.polygon,
  COMMON_MAINNET_CHAIN_IDS.base,
  COMMON_MAINNET_CHAIN_IDS.avalanche,
  COMMON_MAINNET_CHAIN_IDS.arbitrum,
  COMMON_MAINNET_CHAIN_IDS.rootstock
];

export const isWertSupportedChainAssetSlug = (chainAssetSlug: string) => {
  const [chainKind, chainId, assetSlug] = parseChainAssetSlug(chainAssetSlug);

  if (chainKind === TempleChainKind.Tezos && assetSlug === TEZ_TOKEN_SLUG && chainId === TEZOS_MAINNET_CHAIN_ID) {
    return true;
  }

  return (
    chainKind === TempleChainKind.EVM &&
    WERT_SUPPORTED_EVM_CHAIN_IDS.includes(Number(chainId)) &&
    assetSlug === EVM_TOKEN_SLUG
  );
};

export const getWertLink = async (address: string, chainAssetSlug: string, amount = 0) => {
  const { data: sessionId } = await templeWalletApi.get<string>('/wert-session-id');

  const url = new URL(BASE_URL);
  url.search = new URLSearchParams({
    ...getWertCommodityParams(chainAssetSlug),
    currency: 'USD',
    session_id: sessionId,
    currency_amount: amount.toString(),
    address
  }).toString();

  return url.toString();
};

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

const getWertCommodityParams = (chainAssetSlug: string) => {
  const [chainKind, chainId, assetSlug] = parseChainAssetSlug(chainAssetSlug);

  let commodity = {};
  if (chainKind === TempleChainKind.Tezos) {
    commodity = TEZOS_WERT_COMMODITY;
  } else if (assetSlug === EVM_TOKEN_SLUG) {
    commodity = wertCommodityEvmChainIdMap[chainId];
  }

  return {
    ...commodity,
    commodities: JSON.stringify([commodity])
  };
};
