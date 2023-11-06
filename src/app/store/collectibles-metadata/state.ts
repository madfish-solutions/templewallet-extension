import type { TokenMetadata } from 'lib/metadata';

export interface CollectiblesMetadataState {
  records: TokenMetadata[];
  isLoading: boolean;
}

export const collectiblesMetadataInitialState: CollectiblesMetadataState = {
  records: [],
  isLoading: false
};
