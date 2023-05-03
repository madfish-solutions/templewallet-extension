import BigNumber from 'bignumber.js';

import type { AssetMetadataBase } from 'lib/metadata';

import { TEZ_TOKEN_SLUG, Asset, FA2Token } from './types';

const toTokenSlug = (contract: string, id: BigNumber.Value = 0) => {
  return `${contract}_${new BigNumber(id).toFixed()}`;
};

export const tokenToSlug = <T extends { address: string; id?: BigNumber.Value }>({ address, id }: T) => {
  return toTokenSlug(address, id);
};

export const toAssetSlug = (contract: string, id: BigNumber.Value = 0) =>
  contract === TEZ_TOKEN_SLUG ? TEZ_TOKEN_SLUG : toTokenSlug(contract, id);

export const isFA2Token = (asset: Asset): asset is FA2Token =>
  isTezAsset(asset) ? false : typeof asset.id !== 'undefined';

export const isTezAsset = (asset: Asset | string): asset is typeof TEZ_TOKEN_SLUG => asset === TEZ_TOKEN_SLUG;

export const toPenny = (metadata: AssetMetadataBase | nullish) => new BigNumber(1).div(10 ** (metadata?.decimals ?? 0));
