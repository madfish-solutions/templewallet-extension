import { mockPersistedState } from 'lib/store';

import { NoCategoryEvmAssetsMetadataState } from './state';

export const mockNoCategoryEvmAssetsMetadataState = mockPersistedState<NoCategoryEvmAssetsMetadataState>({
  metadataRecord: {},
  contractsChainIds: {},
  accountToAssetAssociations: {},
  metadataLoading: false
});
