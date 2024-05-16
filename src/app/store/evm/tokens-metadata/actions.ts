import { createAction } from '@reduxjs/toolkit';

import { BalancesResponse } from 'lib/apis/temple/endpoints/evm/api.interfaces';
interface proceedLoadedEvmTokensMetadataActionPayload {
  chainId: number;
  data: BalancesResponse;
}

export const proceedLoadedEvmTokensMetadataAction = createAction<proceedLoadedEvmTokensMetadataActionPayload>(
  'evm/PROCEED_LOADED_TOKENS_METADATA_ACTION'
);
