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
  id: string;
  address: string;
  displayUri?: string;
  artifactUri?: string;
  standard?: TokenStandardsEnum | null;
}
export interface TokenMetadataV1 extends AssetMetadataBase {
  id: number;
  address: string;
  displayUri?: string;
  artifactUri?: string;
  standard?: TokenStandardsEnum | null;
}
