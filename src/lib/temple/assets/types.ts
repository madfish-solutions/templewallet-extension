import BigNumber from "bignumber.js";

export interface Token {
  contract: string;
  id?: BigNumber.Value;
}

export interface FA2Token extends Token {
  id: BigNumber.Value;
}

export type Asset = Token | "tez";

export type TokenStandard = "fa1.2" | "fa2";

export enum AssetTypesEnum {
  Collectibles = "collectibles",
}
