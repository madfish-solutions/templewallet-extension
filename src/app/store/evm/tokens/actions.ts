import { createAction } from '@reduxjs/toolkit';

import { BalancesResponse } from 'lib/apis/temple/evm-data.interfaces';
interface proceedLoadedEvmTokensActionPayload {
  publicKeyHash: HexString;
  chainId: number;
  data: BalancesResponse;
}

export const proceedLoadedEvmTokensAction = createAction<proceedLoadedEvmTokensActionPayload>(
  'evm/PROCEED_LOADED_ASSETS_ACTION'
);
