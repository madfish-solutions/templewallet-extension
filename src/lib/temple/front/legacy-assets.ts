import { TezosToolkit } from "@taquito/taquito";

import { isFA2Token, isTezAsset, fromAssetSlug } from "lib/temple/assets";
import { AssetMetadata } from "lib/temple/metadata";

/**
 * @deprecated
 */
export type TempleAsset = TempleTEZAsset | TempleToken;

/**
 * @deprecated
 */
export type TempleToken = TempleFA1_2Asset | TempleFA2Asset;

/**
 * @deprecated
 */
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

/**
 * @deprecated
 */
export const TEZ_ASSET: TempleAsset = {
  type: TempleAssetType.TEZ,
  name: "Tezos",
  symbol: "tez",
  decimals: 6,
  fungible: true,
};

/**
 * @deprecated
 */
export function assetsAreSame(aAsset: TempleAsset, bAsset: TempleAsset) {
  return getAssetKey(aAsset) === getAssetKey(bAsset);
}

/**
 * @deprecated
 */
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

/**
 * @deprecated
 */
export async function toLegacyAsset(
  tezos: TezosToolkit,
  slug: string,
  metadata: AssetMetadata
): Promise<TempleAsset> {
  const asset = await fromAssetSlug(tezos, slug);

  if (isTezAsset(asset)) return TEZ_ASSET;

  const base = {
    decimals: metadata.decimals,
    symbol: metadata.symbol,
    name: metadata.name,
    fungible: true,
  };

  return isFA2Token(asset)
    ? {
        type: TempleAssetType.FA2,
        address: asset.contract,
        id: +asset.id,
        ...base,
      }
    : {
        type: TempleAssetType.FA1_2,
        address: asset.contract,
        ...base,
      };
}

/**
 * @deprecated
 */
export function toSlugFromLegacyAsset(asset: TempleAsset) {
  switch (asset.type) {
    case TempleAssetType.TEZ:
      return "tez";

    case TempleAssetType.FA1_2:
      return `${asset.address}_0`;

    case TempleAssetType.FA2:
      return `${asset.address}_${asset.id}`;
  }
}
