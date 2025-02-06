import type { TokenMetadata } from 'lib/metadata/types';

export interface NoCategoryAssetsMetadataState {
  metadataRecord: StringRecord<TokenMetadata>;
  metadataLoading: boolean;
  contractsChainIds: StringRecord;
  accountToAssetAssociations: StringRecord<string[]>;
}

export const noCategoryAssetsMetadataInitialState: NoCategoryAssetsMetadataState = {
  metadataRecord: {},
  metadataLoading: false,
  contractsChainIds: {},
  accountToAssetAssociations: {}
};
