import { TezosToolkit, compose } from "@taquito/taquito";
import { tzip12, TokenMetadata } from "@taquito/tzip12";
import { tzip16 } from "@taquito/tzip16";
import retry from "async-retry";
import BigNumber from "bignumber.js";

import assert from "lib/assert";

import { fromAssetSlug, isTezAsset } from "../assets";
import { TEZOS_METADATA } from "./defaults";
import { PRESERVED_TOKEN_METADATA } from "./fixtures";
import { AssetMetadata, DetailedAssetMetdata } from "./types";

const RETRY_PARAMS = {
  retries: 5,
  minTimeout: 100,
  maxTimeout: 1_000,
};

export async function fetchTokenMetadata(
  tezos: TezosToolkit,
  assetSlug: string
): Promise<{ base: AssetMetadata; detailed: DetailedAssetMetdata }> {
  const asset = await fromAssetSlug(tezos, assetSlug);

  if (isTezAsset(asset)) {
    return { base: TEZOS_METADATA, detailed: TEZOS_METADATA };
  }

  if (PRESERVED_TOKEN_METADATA.has(assetSlug)) {
    const data = PRESERVED_TOKEN_METADATA.get(assetSlug)!;
    return { base: data, detailed: data };
  }

  try {
    const contract = await retry(
      () => tezos.contract.at(asset.contract, compose(tzip12, tzip16)),
      RETRY_PARAMS
    );
    const assetId = new BigNumber(asset.id ?? 0).toFixed();

    const tzip12Data: TokenMetadataWithLogo = await retry(
      () => contract.tzip12().getTokenMetadata(assetId as any),
      RETRY_PARAMS
    );

    assert(
      "decimals" in tzip12Data &&
        ("name" in tzip12Data || "symbol" in tzip12Data)
    );

    const base: AssetMetadata = {
      decimals: +tzip12Data.decimals,
      symbol: tzip12Data.symbol || tzip12Data.name!.substr(0, 8),
      name: tzip12Data.name || tzip12Data.symbol!,
      shouldPreferSymbol: parseBool(tzip12Data.shouldPreferSymbol),
      thumbnailUri:
        tzip12Data.thumbnailUri ||
        tzip12Data.logo ||
        tzip12Data.icon ||
        tzip12Data.iconUri ||
        tzip12Data.iconUrl,
      artifactUri: tzip12Data.artifactUri,
    };

    let tzip16Data: Record<string, any> | undefined;
    try {
      tzip16Data = await retry(
        () =>
          contract
            .tzip16()
            .getMetadata()
            .then(({ metadata }) => metadata),
        RETRY_PARAMS
      );
    } catch {}

    const detailed: DetailedAssetMetdata = {
      ...(tzip16Data?.assets?.[assetId] ?? {}),
      ...tzip12Data,
      ...base,
    };

    return { base, detailed };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }

    throw new NotFoundTokenMetadata();
  }
}

export class NotFoundTokenMetadata extends Error {
  name = "NotFoundTokenMetadata";
  message = "Metadata for token doesn't found";
}

function parseBool(value: any) {
  if (value === "true") return true;
  if (value === "false") return false;
  return;
}

interface TokenMetadataWithLogo extends TokenMetadata {
  shouldPreferSymbol?: boolean;
  thumbnailUri?: string;
  logo?: string;
  icon?: string;
  iconUri?: string;
  iconUrl?: string;
  artifactUri?: string;
}
