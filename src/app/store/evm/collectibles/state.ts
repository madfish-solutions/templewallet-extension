/** 'idle' for disabled unless balance is positive */
type StoredCollectibleStatus = 'idle' | 'enabled' | 'disabled' | 'removed';

interface StoredAsset {
  status: StoredCollectibleStatus;
  /** `true` if manually added by user */
  manual?: boolean;
}

type PublicKeyHash = HexString;

type TokenSlugStoredCollectibleRecord = Record<string, StoredAsset>;
type ChainIdTokenSlugsRecord = Record<number, TokenSlugStoredCollectibleRecord>;

type EvmStoredCollectiblesRecords = Record<PublicKeyHash, ChainIdTokenSlugsRecord>;

export interface EvmCollectiblesStateInterface {
  record: EvmStoredCollectiblesRecords;
}

export const EvmCollectiblesInitialState: EvmCollectiblesStateInterface = {
  record: {}
};
