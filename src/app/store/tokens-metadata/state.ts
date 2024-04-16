import { ALL_PREDEFINED_METADATAS_RECORD } from 'lib/assets/known-tokens';
import type { MetadataRecords } from 'lib/metadata/types';

export interface TokensMetadataState {
  metadataRecord: MetadataRecords;
  metadataLoading: boolean;
}

export const tokensMetadataInitialState: TokensMetadataState = {
  metadataRecord: ALL_PREDEFINED_METADATAS_RECORD,
  metadataLoading: false
};
