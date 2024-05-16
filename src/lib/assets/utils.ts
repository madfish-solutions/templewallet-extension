import BigNumber from 'bignumber.js';

import type { AssetMetadataBase } from 'lib/metadata';
import { isTezosDcpChainId } from 'temple/networks';

import { TEZ_TOKEN_SLUG, TEZOS_SYMBOL, TEZOS_DCP_SYMBOL, TEZOS_GAS_TOKEN, TEZOS_DCP_GAS_TOKEN } from './defaults';
import type { Asset, FA2Token } from './types';

export const getTezosGasSymbol = (chainId: string) => (isTezosDcpChainId(chainId) ? TEZOS_DCP_SYMBOL : TEZOS_SYMBOL);

export const getTezosGasToken = (chainId: string) =>
  isTezosDcpChainId(chainId) ? TEZOS_DCP_GAS_TOKEN : TEZOS_GAS_TOKEN;

export const toTokenSlug = (contract: string, id: string | number = 0) => `${contract}_${id}`;

export const fromAssetSlug = <T = string>(slug: string) => slug.split('_') as [contract: T, tokenId?: string];

export const tokenToSlug = <T extends { address: string; id?: string | number }>({ address, id }: T) => {
  return toTokenSlug(address, id);
};

export const isFA2Token = (asset: Asset): asset is FA2Token =>
  isTezAsset(asset) ? false : typeof asset.id !== 'undefined';

export const isTezAsset = (asset: Asset | string): asset is typeof TEZ_TOKEN_SLUG => asset === TEZ_TOKEN_SLUG;

export const toPenny = (metadata: AssetMetadataBase | nullish) => new BigNumber(1).div(10 ** (metadata?.decimals ?? 0));

export const fromFa2TokenSlug = (slug: string): FA2Token => {
  if (isTezAsset(slug)) {
    throw new Error('Only fa2 token slug allowed');
  }

  const [contractAddress, tokenIdStr] = fromAssetSlug(slug);

  return {
    contract: contractAddress,
    id: tokenIdStr ?? '0'
  };
};
