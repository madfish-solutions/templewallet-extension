import { createAction } from '@reduxjs/toolkit';

import { NftAddressBalanceNftResponse } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { EvmCollectibleMetadata } from 'lib/metadata/types';

interface processLoadedEvmCollectiblesMetadataActionPayload {
  chainId: number;
  data: NftAddressBalanceNftResponse;
}

export const processLoadedEvmCollectiblesMetadataAction =
  createAction<processLoadedEvmCollectiblesMetadataActionPayload>(
    'evm/collectible-metadata/PROCESS_LOADED_COLLECTIBLES_METADATA_ACTION'
  );

interface putEvmCollectiblesMetadataActionActionPayload {
  chainId: number;
  records: Record<string, EvmCollectibleMetadata | undefined>;
}

export const putEvmCollectiblesMetadataAction = createAction<putEvmCollectiblesMetadataActionActionPayload>(
  'evm/collectible-metadata/PUT_COLLECTIBLES_METADATA_ACTION'
);
