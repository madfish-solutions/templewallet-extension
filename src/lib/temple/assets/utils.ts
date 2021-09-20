import { TezosToolkit } from "@taquito/taquito";
import BigNumber from "bignumber.js";

import { loadContract } from "lib/temple/contract";
import { AssetMetadata } from "lib/temple/metadata";

import { detectTokenStandard } from "./tokenStandard";
import { Asset, Token, FA2Token } from "./types";

export async function toTransferParams(
  tezos: TezosToolkit,
  assetSlug: string,
  assetMetadata: AssetMetadata | null,
  fromPkh: string,
  toPkh: string,
  amount: BigNumber.Value
) {
  const asset = await fromAssetSlug(tezos, assetSlug);

  if (isTezAsset(asset)) {
    return {
      to: toPkh,
      amount: amount as any,
    };
  } else {
    const contact = await loadContract(tezos, asset.contract);
    const pennyAmount = new BigNumber(amount)
      .times(10 ** (assetMetadata?.decimals ?? 0))
      .toFixed();
    const methodArgs = isFA2Token(asset)
      ? [
          [
            {
              from_: fromPkh,
              txs: [{ to_: toPkh, token_id: asset.id, amount: pennyAmount }],
            },
          ],
        ]
      : [fromPkh, toPkh, pennyAmount];

    return contact.methods.transfer(...methodArgs).toTransferParams();
  }
}

export async function fromAssetSlug(
  tezos: TezosToolkit,
  slug: string
): Promise<Asset> {
  if (isTezAsset(slug)) return slug;

  const [contractAddress, tokenIdStr] = slug.split("_");
  const tokenStandard = await detectTokenStandard(tezos, contractAddress);

  return {
    contract: contractAddress,
    id: tokenStandard === "fa2" ? new BigNumber(tokenIdStr ?? 0) : undefined,
  };
}

export function toAssetSlug(asset: Asset) {
  return isTezAsset(asset) ? asset : toTokenSlug(asset.contract, asset.id);
}

export function toTokenSlug(contract: string, id: BigNumber.Value = 0) {
  return `${contract}_${new BigNumber(id).toFixed()}`;
}

export function isFA2Token(token: Token): token is FA2Token {
  return typeof token.id !== "undefined";
}

export function isTezAsset(asset: Asset | string): asset is "tez" {
  return asset === "tez";
}

export function isTokenAsset(asset: Asset): asset is Token {
  return asset !== "tez";
}

export function toPenny(metadata: AssetMetadata | null) {
  return new BigNumber(1).div(10 ** (metadata?.decimals ?? 0));
}
