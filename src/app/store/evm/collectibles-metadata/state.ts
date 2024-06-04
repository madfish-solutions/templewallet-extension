import { EvmCollectibleMetadata } from 'lib/metadata/types';

type ChainId = number;
export type CollectibleSlugCollectibleMetadataRecord = StringRecord<EvmCollectibleMetadata>;
type EvmCollectibleMetadataRecord = Record<ChainId, CollectibleSlugCollectibleMetadataRecord>;

export interface EvmCollectiblesMetadataState {
  metadataRecord: EvmCollectibleMetadataRecord;
}

export const evmCollectiblesMetadataInitialState: EvmCollectiblesMetadataState = {
  metadataRecord: {}
};
