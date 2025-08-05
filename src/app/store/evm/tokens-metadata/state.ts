import { EvmTokenMetadata } from 'lib/metadata/types';

type ChainId = number;

type TokenSlugTokenMetadataRecord = StringRecord<EvmTokenMetadata>;

export type EvmTokenMetadataRecord = Record<ChainId, TokenSlugTokenMetadataRecord>;

export interface EvmTokensMetadataState {
  metadataRecord: EvmTokenMetadataRecord;
}

export const evmTokensMetadataInitialState: EvmTokensMetadataState = {
  metadataRecord: {}
};
