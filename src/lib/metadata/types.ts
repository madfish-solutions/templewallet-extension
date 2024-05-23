import { NftCollectionAttribute } from '../apis/temple/endpoints/evm/api.interfaces';
import { EvmAssetStandard } from '../evm/types';

export enum TezosTokenStandardsEnum {
  Fa2 = 'fa2',
  Fa12 = 'fa12'
}

export interface AssetMetadataBase {
  name: string;
  symbol: string;
  decimals: number;
  thumbnailUri?: string;
}

export interface TokenMetadata extends AssetMetadataBase {
  address: string;
  id: string;
  standard?: TezosTokenStandardsEnum;
  displayUri?: string;
  artifactUri?: string;
}

export type MetadataRecords = Record<string, TokenMetadata>;

/**
 * Maps are up to 2000 times faster to read from than arrays.
 * Be sure to convert to a serializible value before persisting.
 */
export type MetadataMap = Map<string, TokenMetadata>;

export const EVM_NATIVE_TOKEN_ADDRESS = 'eth';

export interface EvmAssetMetadataBase {
  standard: EvmAssetStandard;
  address: typeof EVM_NATIVE_TOKEN_ADDRESS | HexString;
}

export interface EvmTokenMetadata extends EvmAssetMetadataBase {
  name: string;
  symbol: string;
  decimals: number;
  native: boolean;
}

export interface EvmCollectibleMetadata extends EvmAssetMetadataBase {
  tokenId: string;
  collectionName: string;
  collectionSymbol: string;
  metadataUri: string;
  image: string;
  name: string;
  description: string;
  attributes?: NftCollectionAttribute[];
  externalUrl?: string;
  animationUrl?: string;
  originalOwner?: string;
}
