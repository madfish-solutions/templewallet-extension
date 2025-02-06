import { tokenToSlug } from 'lib/assets';

import { mockFA1_2TokenMetadata, mockFA2TokenMetadata } from '../utils';

import { NoCategoryAssetsMetadataState } from './state';

export const mockNoCategoryAssetsMetadataState: NoCategoryAssetsMetadataState = {
  metadataRecord: {
    [tokenToSlug(mockFA1_2TokenMetadata)]: mockFA1_2TokenMetadata,
    [tokenToSlug(mockFA2TokenMetadata)]: mockFA2TokenMetadata
  },
  contractsChainIds: {
    [mockFA1_2TokenMetadata.address]: 'NetXdQprcVkpaWU',
    [mockFA2TokenMetadata.address]: 'NetXdQprcVkpaWU'
  },
  accountToAssetAssociations: {
    mockAddress: [tokenToSlug(mockFA1_2TokenMetadata), tokenToSlug(mockFA2TokenMetadata)]
  },
  metadataLoading: false
};
