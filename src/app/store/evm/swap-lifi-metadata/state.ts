import { LifiEvmTokenMetadata } from 'lib/metadata/types';

type ChainId = number;

export type TokenSlugTokenMetadataRecord = StringRecord<LifiEvmTokenMetadata>;

export type LifiEvmTokenMetadataRecord = Record<ChainId, TokenSlugTokenMetadataRecord>;

export interface LifiEvmTokensMetadataState {
  connectedTokensMetadataRecord: LifiEvmTokenMetadataRecord;
  enabledChainsTokensMetadataRecord: LifiEvmTokenMetadataRecord;
  supportedChainIds: number[];
  lastFetchTime?: number;
  isLoading: boolean;
  error: any | null;
}

export const lifiEvmTokensMetadataInitialState: LifiEvmTokensMetadataState = {
  connectedTokensMetadataRecord: {},
  enabledChainsTokensMetadataRecord: {},
  supportedChainIds: [],
  lastFetchTime: undefined,
  isLoading: false,
  error: null
};
