import BigNumber from 'bignumber.js';

import { AssetTypesEnum, TEZ_TOKEN_SLUG, GAS_TOKEN_SLUG, Asset, FA2Token } from './types';

export { AssetTypesEnum, GAS_TOKEN_SLUG, TEZ_TOKEN_SLUG };

const toTokenSlug = (contract: string, id: BigNumber.Value = 0) => {
  return `${contract}_${new BigNumber(id).toFixed()}`;
};

export const tokenToSlug = <T extends { address: string; id?: BigNumber.Value }>({ address, id }: T) => {
  return toTokenSlug(address, id);
};

export function toAssetSlug(contract: string, id: BigNumber.Value = 0) {
  return contract === GAS_TOKEN_SLUG ? GAS_TOKEN_SLUG : toTokenSlug(contract, id);
}

export function isFA2Token(asset: Asset): asset is FA2Token {
  return isGasAsset(asset) ? false : typeof asset.id !== 'undefined';
}

export function isTezAsset(asset: Asset | string): asset is typeof TEZ_TOKEN_SLUG {
  return isGasAsset(asset);
}

export function isGasAsset(asset: Asset | string): asset is typeof GAS_TOKEN_SLUG {
  return asset === GAS_TOKEN_SLUG;
}
