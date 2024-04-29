import { createAction } from '@reduxjs/toolkit';

import { BalancesResponse } from 'lib/apis/temple/evm-data.interfaces';
interface proceedLoadedEvmBalancesActionPayload {
  publicKeyHash: HexString;
  chainId: number;
  data: BalancesResponse;
}

export const proceedLoadedEvmBalancesAction = createAction<proceedLoadedEvmBalancesActionPayload>(
  'evm/PROCEED_LOADED_EVM_BALANCES_ACTION'
);
