import { createAction } from '@reduxjs/toolkit';

import { BalancesResponse } from 'lib/apis/temple/evm-data.interfaces';
interface proceedLoadedEvmTokensBalancesActionPayload {
  publicKeyHash: HexString;
  chainId: number;
  data: BalancesResponse;
}

export const proceedLoadedEvmTokensBalancesAction = createAction<proceedLoadedEvmTokensBalancesActionPayload>(
  'evm/PROCEED_LOADED_TOKENS_BALANCES_ACTION'
);
