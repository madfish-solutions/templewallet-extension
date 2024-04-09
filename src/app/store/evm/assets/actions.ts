import { createAction } from '@reduxjs/toolkit';

import { BalancesResponse } from 'lib/apis/temple/evm-data.interfaces';
interface proceedLoadedEVMAssetsActionPayload {
  publicKeyHash: string;
  data: BalancesResponse[];
}

export const proceedLoadedEVMAssetsAction = createAction<proceedLoadedEVMAssetsActionPayload>(
  'evm/PROCEED_LOADED_EVM_ASSETS_ACTION'
);
