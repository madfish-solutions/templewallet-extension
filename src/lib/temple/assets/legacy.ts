export type TempleAsset = TempleTEZAsset | TempleToken;

export type TempleToken = TempleFA1_2Asset | TempleFA2Asset;

export enum TempleAssetType {
  TEZ = "TEZ",
  FA1_2 = "FA1_2",
  FA2 = "FA2",
}

export interface TempleAssetBase {
  type: TempleAssetType;
  decimals: number;
  symbol: string;
  name: string;
  fungible: boolean;
}

export interface TempleTokenBase extends TempleAssetBase {
  address: string;
  iconUrl?: string;
}

export interface TempleTEZAsset extends TempleAssetBase {
  type: TempleAssetType.TEZ;
}

export interface TempleFA1_2Asset extends TempleTokenBase {
  type: TempleAssetType.FA1_2;
}

export interface TempleFA2Asset extends TempleTokenBase {
  type: TempleAssetType.FA2;
  id: number;
}

export const TEZ_ASSET: TempleAsset = {
  type: TempleAssetType.TEZ,
  name: "Tezos",
  symbol: "tez",
  decimals: 6,
  fungible: true,
};

export function assetsAreSame(aAsset: TempleAsset, bAsset: TempleAsset) {
  return getAssetKey(aAsset) === getAssetKey(bAsset);
}

export function getAssetKey(asset: TempleAsset) {
  switch (asset.type) {
    case TempleAssetType.TEZ:
      return "tez";

    case TempleAssetType.FA2:
      return `${asset.address}_${asset.id}`;

    default:
      return `${asset.address}_0`;
  }
}
