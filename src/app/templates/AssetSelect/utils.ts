import { IAsset } from './interfaces';

export const getSlug = (asset: IAsset) => {
  return asset === 'tez' ? asset : asset.tokenSlug;
};
