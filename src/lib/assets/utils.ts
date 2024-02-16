import BigNumber from 'bignumber.js';

import type { AssetMetadataBase } from 'lib/metadata';

import type { Asset, FA2Token } from './types';

export const TEZ_TOKEN_SLUG = 'tez' as const;

export const toTokenSlug = (contract: string, id: string | number = 0) => `${contract}_${id}`;

export const fromAssetSlug = (slug: string) => slug.split('_') as [contract: string, tokenId?: string];

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
