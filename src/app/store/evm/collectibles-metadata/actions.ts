import { createAction } from '@reduxjs/toolkit';

import { NftAddressBalanceNftResponse } from 'lib/apis/temple/evm-data.interfaces';
interface proceedLoadedEvmCollectiblesMetadataActionPayload {
  chainId: number;
  data: NftAddressBalanceNftResponse;
}

export const proceedLoadedEvmCollectiblesMetadataAction =
  createAction<proceedLoadedEvmCollectiblesMetadataActionPayload>('evm/PROCEED_LOADED_COLLECTIBLES_METADATA_ACTION');
