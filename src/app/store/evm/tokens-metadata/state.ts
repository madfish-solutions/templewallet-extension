import { EVMTokenMetadata } from 'lib/metadata/types';

type TokenSlugWithChainId = string;

export type EVMMetadataRecords = Record<TokenSlugWithChainId, EVMTokenMetadata>;

export interface EVMTokensMetadataState {
  metadataRecord: EVMMetadataRecords;
}

export const evmTokensMetadataInitialState: EVMTokensMetadataState = {
  metadataRecord: {}
};
