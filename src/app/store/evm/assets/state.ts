/** 'idle' for disabled unless balance is positive */
type StoredAssetStatus = 'idle' | 'enabled' | 'disabled' | 'removed';

interface StoredAsset {
  status: StoredAssetStatus;
  /** `true` if manually added by user */
  manual?: boolean;
}

type PublicKeyHash = HexString;

type TokenSlugStoredAssetRecord = Record<string, StoredAsset>;
type ChainIdTokenSlugsRecord = Record<number, TokenSlugStoredAssetRecord>;

type EvmStoredAssetsRecords = Record<PublicKeyHash, ChainIdTokenSlugsRecord>;

export interface EvmAssetsStateInterface {
  tokens: EvmStoredAssetsRecords;
  collectibles: EvmStoredAssetsRecords;
}

export const EvmAssetsInitialState: EvmAssetsStateInterface = {
  tokens: {},
  collectibles: {}
};
