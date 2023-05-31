import { tokenToSlug } from 'lib/assets';

import { TokensMetadataState } from './state';
import { mockFA1_2TokenMetadata, mockFA2TokenMetadata } from './utils';

export const mockTokensMetadataState: TokensMetadataState = {
  metadataRecord: {
    [tokenToSlug(mockFA1_2TokenMetadata)]: mockFA1_2TokenMetadata,
    [tokenToSlug(mockFA2TokenMetadata)]: mockFA2TokenMetadata
  }
};
