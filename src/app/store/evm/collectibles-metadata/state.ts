import { EvmCollectibleMetadata } from 'lib/metadata/types';

type ChainId = number;
type CollectibleSlugCollectibleMetadataRecord = StringRecord<EvmCollectibleMetadata>;
export type EvmCollectibleMetadataRecord = Record<ChainId, CollectibleSlugCollectibleMetadataRecord>;

export interface EvmCollectiblesMetadataState {
  metadataRecord: EvmCollectibleMetadataRecord;
  lastFullLoadAccount?: HexString;
  seenChainsByAccount: StringRecord<number[]>;
  checkedSlugsByAccount: StringRecord<Record<number, string[]>>;
}

export const evmCollectiblesMetadataInitialState: EvmCollectiblesMetadataState = {
  metadataRecord: {},
  seenChainsByAccount: {},
  checkedSlugsByAccount: {}
};
