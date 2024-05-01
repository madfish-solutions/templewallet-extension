import { EvmCollectibleMetadata } from 'lib/metadata/types';

type ChainId = number;
export type TokenSlugCollectibleMetadataRecord = StringRecord<EvmCollectibleMetadata>;
type EvmCollectibleMetadataRecord = Record<ChainId, TokenSlugCollectibleMetadataRecord>;

export interface EvmCollectiblesMetadataState {
  metadataRecord: EvmCollectibleMetadataRecord;
}

export const evmCollectiblesMetadataInitialState: EvmCollectiblesMetadataState = {
  metadataRecord: {}
};
