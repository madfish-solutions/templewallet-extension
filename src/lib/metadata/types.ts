export enum TokenStandardsEnum {
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
  standard?: TokenStandardsEnum;
  displayUri?: string;
  artifactUri?: string;
}

export type MetadataRecords = Record<string, TokenMetadata>;

/**
 * Maps are up to 2000 times faster to read from than arrays.
 * Be sure to convert to a serializible value before persisting.
 */
export type MetadataMap = Map<string, TokenMetadata>;

export interface EVMTokenMetadata extends AssetMetadataBase {
  address: string;
  native: boolean;
  thumbnailUri: string;
}
