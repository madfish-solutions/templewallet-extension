/** 'idle' for disabled unless balance is positive */
type StoredAssetStatus = 'idle' | 'enabled' | 'disabled' | 'removed';

interface StoredAsset {
  status: StoredAssetStatus;
  /** `true` if manually added by user */
  manual?: boolean;
}

type PublicKeyHash = HexString;

export type AssetSlugStoredAssetRecord = Record<string, StoredAsset>;
export type ChainIdTokenSlugsAssetsRecord = Record<number, AssetSlugStoredAssetRecord>;

export type EvmStoredAssetsRecords = Record<PublicKeyHash, ChainIdTokenSlugsAssetsRecord>;

export interface EvmAssetsStateInterface {
  tokens: EvmStoredAssetsRecords;
  collectibles: EvmStoredAssetsRecords;
}

export const EvmAssetsInitialState: EvmAssetsStateInterface = {
  tokens: {},
  collectibles: {}
};
