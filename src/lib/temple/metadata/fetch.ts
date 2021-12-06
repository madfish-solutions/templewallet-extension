import { TezosToolkit, compose, Context, ContractAbstraction, ContractProvider } from '@taquito/taquito';
import { tzip12, TokenMetadata } from '@taquito/tzip12';
import { DEFAULT_HANDLERS, MetadataProvider, tzip16, MetadataInterface } from '@taquito/tzip16';
import retry from 'async-retry';
import BigNumber from 'bignumber.js';

import assert from 'lib/assert';

import { fromAssetSlug, isTezAsset } from '../assets';
import { TEZOS_METADATA } from './defaults';
import { PRESERVED_TOKEN_METADATA } from './fixtures';
import { AssetMetadata, DetailedAssetMetdata } from './types';

const RETRY_PARAMS = {
  retries: 5,
  minTimeout: 100,
  maxTimeout: 1_000
};

const getTzip12Metadata = async (contract: ReturnType<typeof tzip12>, tokenId: number) => {
  let tzip12Metadata: TokenMetadataWithLogo = {} as TokenMetadataWithLogo;

  try {
    tzip12Metadata = await retry(() => contract.tzip12().getTokenMetadata(tokenId), RETRY_PARAMS);
  } catch {}

  return tzip12Metadata;
};

const getTzip16Metadata = async (contract: ReturnType<typeof tzip16>) => {
  let tzip16Metadata: Record<string, any> = {};

  try {
    tzip16Metadata = await retry(
      () =>
        contract
          .tzip16()
          .getMetadata()
          .then(({ metadata }) => metadata),
      RETRY_PARAMS
    );
  } catch {}

  return tzip16Metadata;
};

const getMetadataFromUri = async (
  contract: ContractAbstraction<ContractProvider>,
  tokenId: string,
  tezos: TezosToolkit
) => {
  let metadataFromUri: MetadataInterface = {};

  try {
    const storage = await contract.storage<any>();
    assert('token_metadata_uri' in storage);

    const metadataUri = storage.token_metadata_uri.replace('{tokenId}', tokenId);

    const metadataProvider = new MetadataProvider(DEFAULT_HANDLERS);
    const context = new Context(tezos.rpc);

    metadataFromUri = await metadataProvider
      .provideMetadata(contract, metadataUri, context)
      .then(({ metadata }) => metadata);
  } catch {}

  return metadataFromUri;
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
    const contract = await retry(() => tezos.contract.at(asset.contract, compose(tzip12, tzip16)), RETRY_PARAMS);
    const assetId = new BigNumber(asset.id ?? 0).toFixed();

    const tzip12Metadata = await getTzip12Metadata(contract, assetId as any);
    const metadataFromUri = await getMetadataFromUri(contract, assetId, tezos);

    const rawMetadata = { ...metadataFromUri, ...tzip12Metadata };

    assert('decimals' in rawMetadata && ('name' in rawMetadata || 'symbol' in rawMetadata));

    const base: AssetMetadata = {
      decimals: +rawMetadata.decimals,
      symbol: rawMetadata.symbol || rawMetadata.name!.substr(0, 8),
      name: rawMetadata.name || rawMetadata.symbol!,
      shouldPreferSymbol: parseBool(rawMetadata.shouldPreferSymbol),
      thumbnailUri:
        rawMetadata.thumbnailUri || rawMetadata.logo || rawMetadata.icon || rawMetadata.iconUri || rawMetadata.iconUrl,
      displayUri: rawMetadata.displayUri,
      artifactUri: rawMetadata.artifactUri
    };

    const tzip16Metadata = await getTzip16Metadata(contract);

    const detailed: DetailedAssetMetdata = {
      ...tzip16Metadata?.assets?.[assetId],
      ...rawMetadata,
      ...base
    };

    return { base, detailed };
  } catch (err: any) {
    console.error(err);

    throw new NotFoundTokenMetadata();
  }
}

export class NotFoundTokenMetadata extends Error {
  name = 'NotFoundTokenMetadata';
  message = "Metadata for token doesn't found";
}

function parseBool(value: any) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return;
}

interface TokenMetadataWithLogo extends TokenMetadata {
  shouldPreferSymbol?: boolean;
  thumbnailUri?: string;
  logo?: string;
  icon?: string;
  iconUri?: string;
  iconUrl?: string;
  displayUri?: string;
  artifactUri?: string;
}
