import { createAction } from '@reduxjs/toolkit';

import { NftAddressBalanceNftResponse } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { EvmCollectibleMetadata } from 'lib/metadata/types';

interface proceedLoadedEvmCollectiblesMetadataActionPayload {
  chainId: number;
  data: NftAddressBalanceNftResponse;
}

export const proceedLoadedEvmCollectiblesMetadataAction =
  createAction<proceedLoadedEvmCollectiblesMetadataActionPayload>('evm/PROCEED_LOADED_COLLECTIBLES_METADATA_ACTION');

interface putEvmCollectiblesMetadataActionActionPayload {
  chainId: number;
  records: Record<string, EvmCollectibleMetadata | undefined>;
}

export const putEvmCollectiblesMetadataAction = createAction<putEvmCollectiblesMetadataActionActionPayload>(
  'evm/PUT_COLLECTIBLES_METADATA_ACTION'
);
