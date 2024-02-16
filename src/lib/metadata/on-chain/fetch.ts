import { compose, Context, ContractAbstraction, ContractProvider, TezosToolkit } from '@taquito/taquito';
import { TokenMetadata, tzip12 } from '@taquito/tzip12';
import { DEFAULT_HANDLERS, MetadataInterface, MetadataProvider, tzip16 } from '@taquito/tzip16';
import retry from 'async-retry';

import { isValidContractAddress } from 'lib/temple/helpers';
import { assert } from 'lib/utils';

import type { TokenMetadataOnChain, DetailedTokenMetdataOnChain } from './types';

const RETRY_PARAMS = {
  retries: 5,
  minTimeout: 100,
  maxTimeout: 1_000
};

const getTzip12Metadata = async (contract: ReturnType<typeof tzip12>, tokenId: string | number) => {
  let tzip12Metadata: TokenMetadataWithLogo = {} as TokenMetadataWithLogo;

  try {
    tzip12Metadata = await retry(() => contract.tzip12().getTokenMetadata(Number(tokenId)), RETRY_PARAMS);
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
  let metadataFromUri: MetadataInterface & { thumbnail_uri?: string } = {};

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
  contractAddress: string,
  tokenId: string,
  detailed: boolean = false
): Promise<DetailedTokenMetdataOnChain | null> {
  if (!isValidContractAddress(contractAddress)) {
    throw new Error('Invalid contract address');
  }

  try {
    const contract = await retry(() => tezos.contract.at(contractAddress, compose(tzip12, tzip16)), RETRY_PARAMS);

    const tzip12Metadata = await getTzip12Metadata(contract, tokenId);
    const metadataFromUri = await getMetadataFromUri(contract, tokenId, tezos);

    const rawMetadata = { ...metadataFromUri, ...tzip12Metadata };

    if (!('decimals' in rawMetadata && ('name' in rawMetadata || 'symbol' in rawMetadata))) {
      return null;
    }

    const baseMetadata: TokenMetadataOnChain = {
      decimals: +rawMetadata.decimals,
      symbol: rawMetadata.symbol || rawMetadata.name!.substring(0, 8),
      name: rawMetadata.name || rawMetadata.symbol!,
      shouldPreferSymbol: parseBool(rawMetadata.shouldPreferSymbol),
      thumbnailUri:
        rawMetadata.thumbnailUri ||
        rawMetadata.thumbnail_uri ||
        rawMetadata.logo ||
        rawMetadata.icon ||
        rawMetadata.iconUri ||
        rawMetadata.iconUrl ||
        rawMetadata.displayUri ||
        rawMetadata.artifactUri,
      displayUri: rawMetadata.displayUri,
      artifactUri: rawMetadata.artifactUri
    };

    if (detailed === false) return baseMetadata;

    const tzip16Metadata = await getTzip16Metadata(contract);

    const detailedMetadata: DetailedTokenMetdataOnChain = {
      ...tzip16Metadata?.assets?.[tokenId],
      ...rawMetadata,
      ...baseMetadata
    };

    return detailedMetadata;
  } catch (error) {
    console.error(error);

    throw new TokenMetadataNotFoundError();
  }
}

export class TokenMetadataNotFoundError extends Error {
  name = 'TokenMetadataNotFoundError';
  message = "Metadata for token doesn't found";
}

function parseBool(value: any) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
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
