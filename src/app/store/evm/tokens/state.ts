/** 'idle' for disabled unless balance is positive */
type StoredAssetStatus = 'idle' | 'enabled' | 'disabled' | 'removed';

interface StoredAsset {
  status: StoredAssetStatus;
  /** `true` if manually added by user */
  manual?: boolean;
}

type PublicKeyHash = HexString;

type TokenSlugStoredTokenRecord = Record<string, StoredAsset>;
type ChainIdTokenSlugsRecord = Record<number, TokenSlugStoredTokenRecord>;

type EvmStoredTokensRecords = Record<PublicKeyHash, ChainIdTokenSlugsRecord>;

export interface EvmTokensStateInterface {
  record: EvmStoredTokensRecords;
}

export const EvmTokensInitialState: EvmTokensStateInterface = {
  record: {}
};
