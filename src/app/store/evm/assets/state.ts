/** 'idle' for disabled unless balance is positive */
type StoredAssetStatus = 'idle' | 'enabled' | 'disabled' | 'removed';

interface StoredAsset {
  status: StoredAssetStatus;
  /** `true` if manually added by user */
  manual?: boolean;
}

type PublicKeyHash = HexString;

type TokenSlugStoredAssetsRecord = Record<string, StoredAsset>;
type ChainIdTokenSlugsRecord = Record<number, TokenSlugStoredAssetsRecord>;

type EvmStoredAssetsRecords = Record<PublicKeyHash, ChainIdTokenSlugsRecord>;

export interface EvmAssetsStateInterface {
  assets: EvmStoredAssetsRecords;
}

export const EvmAssetsInitialState: EvmAssetsStateInterface = {
  assets: {}
};
