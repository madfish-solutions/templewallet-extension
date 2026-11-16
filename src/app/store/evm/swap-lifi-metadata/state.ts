import { LifiEvmTokenMetadata } from 'lib/metadata/types';

type ChainId = number;

export type TokenSlugTokenMetadataRecord = StringRecord<LifiEvmTokenMetadata>;

export type LifiEvmTokenMetadataRecord = Record<ChainId, TokenSlugTokenMetadataRecord>;

export interface LifiEvmTokensMetadataState {
  connectedTokensMetadataRecord: LifiEvmTokenMetadataRecord;
  enabledChainsTokensMetadataRecord: LifiEvmTokenMetadataRecord;
  supportedChainIds: number[];
  /** When `enabledChainsTokensMetadataRecord` was last downloaded. */
  catalogueFetchedAt?: number;
  lastFetchTime?: number;
  isLoading: boolean;
  error: any | null;
}

export const lifiEvmTokensMetadataInitialState: LifiEvmTokensMetadataState = {
  connectedTokensMetadataRecord: {},
  enabledChainsTokensMetadataRecord: {},
  supportedChainIds: [],
  catalogueFetchedAt: undefined,
  lastFetchTime: undefined,
  isLoading: false,
  error: null
};
