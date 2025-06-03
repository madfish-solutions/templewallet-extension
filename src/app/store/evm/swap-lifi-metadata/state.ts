import { LifiEvmTokenMetadata } from 'lib/metadata/types';

type ChainId = number;

export type TokenSlugTokenMetadataRecord = StringRecord<LifiEvmTokenMetadata>;

export type LifiEvmTokenMetadataRecord = Record<ChainId, TokenSlugTokenMetadataRecord>;

export interface LifiEvmTokensMetadataState {
  metadataRecord: LifiEvmTokenMetadataRecord;
  lastFetchTime?: number;
  isLoading: boolean;
  error: any | null;
}

export const lifiEvmTokensMetadataInitialState: LifiEvmTokensMetadataState = {
  metadataRecord: {},
  lastFetchTime: undefined,
  isLoading: false,
  error: null
};
