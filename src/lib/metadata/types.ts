import { ChainID } from '../apis/temple/evm-data.interfaces';

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

export interface EVMTokenMetadata extends AssetMetadataBase {
  address: string;
  chainID: ChainID;
  native: boolean;
  thumbnailUri: string;
}
