import BigNumber from 'bignumber.js';

import type { AssetMetadataBase } from 'lib/metadata';

import { Asset, FA2Token } from './types';

export const TEZ_TOKEN_SLUG = 'tez';
export const TEMPLE_TOKEN_SLUG = 'KT1VaEsVNiBoA56eToEK6n6BcPgh1tdx9eXi_0';

export const toTokenSlug = (contract: string, id: BigNumber.Value = 0) => {
  return `${contract}_${new BigNumber(id).toFixed()}`;
};

export const tokenToSlug = <T extends { address: string; id?: BigNumber.Value }>({ address, id }: T) => {
  return toTokenSlug(address, id);
};

export const isFA2Token = (asset: Asset): asset is FA2Token =>
  isTezAsset(asset) ? false : typeof asset.id !== 'undefined';

export const isTezAsset = (asset: Asset | string): asset is typeof TEZ_TOKEN_SLUG => asset === TEZ_TOKEN_SLUG;

export const toPenny = (metadata: AssetMetadataBase | nullish) => new BigNumber(1).div(10 ** (metadata?.decimals ?? 0));
