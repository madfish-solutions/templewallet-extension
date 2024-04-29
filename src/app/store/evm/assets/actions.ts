import { createAction } from '@reduxjs/toolkit';

import { BalancesResponse } from 'lib/apis/temple/evm-data.interfaces';
interface proceedLoadedEvmAssetsActionPayload {
  publicKeyHash: HexString;
  chainId: number;
  data: BalancesResponse;
}

export const proceedLoadedEvmAssetsAction = createAction<proceedLoadedEvmAssetsActionPayload>(
  'evm/PROCEED_LOADED_EVM_ASSETS_ACTION'
);
