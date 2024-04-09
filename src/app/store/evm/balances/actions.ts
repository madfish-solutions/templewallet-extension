import { createAction } from '@reduxjs/toolkit';

import { BalancesResponse } from 'lib/apis/temple/evm-data.interfaces';
interface proceedLoadedEVMBalancesActionPayload {
  publicKeyHash: string;
  data: BalancesResponse[];
}

export const proceedLoadedEVMBalancesAction = createAction<proceedLoadedEVMBalancesActionPayload>(
  'evm/PROCEED_LOADED_EVM_BALANCES_ACTION'
);
