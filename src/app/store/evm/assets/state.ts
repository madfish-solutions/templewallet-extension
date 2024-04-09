/** 'idle' for disabled unless balance is positive */
type StoredAssetStatus = 'idle' | 'enabled' | 'disabled' | 'removed';

interface StoredAsset {
  status: StoredAssetStatus;
  /** `true` if manually added by user */
  manual?: boolean;
}

type PublicKeyHash = string;
export type TokenSlugWithChainIdStoredAssetRecord = Record<string, StoredAsset>;

export type EVMStoredAssetsRecords = Record<PublicKeyHash, TokenSlugWithChainIdStoredAssetRecord>;

export interface EVMAssetsStateInterface {
  tokens: EVMStoredAssetsRecords;
}

export const EVMAssetsInitialState: EVMAssetsStateInterface = {
  tokens: {}
};
