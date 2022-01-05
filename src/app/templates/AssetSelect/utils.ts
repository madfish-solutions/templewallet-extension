import { IAsset } from './interfaces';

export function getSlug(asset: IAsset) {
  return asset === 'tez' ? asset : asset.tokenSlug;
}
