import { NftCollectionAttribute } from '../apis/temple/evm-data.interfaces';

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

export interface EvmTokenMetadata extends AssetMetadataBase {
  address: HexString;
  native: boolean;
  thumbnailUri: string;
}

export interface EvmCollectibleMetadata {
  address: HexString;
  tokenId: number;
  name: string;
  description: string;
  originalUri: string;
  thumbnailUri: string;
  displayUri: string;
  artifactUri: string;
  attributes: NftCollectionAttribute[];
  mimeType: string | null;
}
