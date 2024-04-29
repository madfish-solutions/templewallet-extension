import { EvmTokenMetadata } from 'lib/metadata/types';

type ChainId = number;
type TokenSlugMetadataRecord = StringRecord<EvmTokenMetadata>;
type EvmTokenMetadataRecord = Record<ChainId, TokenSlugMetadataRecord>;

export interface EvmTokensMetadataState {
  metadataRecord: EvmTokenMetadataRecord;
}

export const evmTokensMetadataInitialState: EvmTokensMetadataState = {
  metadataRecord: {}
};
