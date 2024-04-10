import { createAction } from '@reduxjs/toolkit';

import { BalancesResponse } from 'lib/apis/temple/evm-data.interfaces';
interface proceedLoadedEVMTokensMetadataActionPayload {
  data: BalancesResponse[];
}

export const proceedLoadedEVMTokensMetadataAction = createAction<proceedLoadedEVMTokensMetadataActionPayload>(
  'evm/PROCEED_LOADED_EVM_TOKENS_METADATA_ACTION'
);
