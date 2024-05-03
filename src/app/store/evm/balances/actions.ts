import { createAction } from '@reduxjs/toolkit';

import { BalancesResponse } from 'lib/apis/temple/evm-data.interfaces';
interface proceedLoadedEvmTokensBalancesActionPayload {
  publicKeyHash: HexString;
  chainId: number;
  data: BalancesResponse;
}

export const proceedLoadedEvmAssetsBalancesAction = createAction<proceedLoadedEvmTokensBalancesActionPayload>(
  'evm/PROCEED_LOADED_ASSETS_BALANCES_ACTION'
);
