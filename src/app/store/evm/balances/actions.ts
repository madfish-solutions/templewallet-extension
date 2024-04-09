import { createAction } from '@reduxjs/toolkit';

import { BalancesResponse } from 'lib/apis/temple/evm-data.interfaces';
interface loadEVMBalancesActionPayload {
  publicKeyHash: string;
  data: BalancesResponse[];
}

export const proceedLoadedEVMBalancesAction =
  createAction<loadEVMBalancesActionPayload>('evm/LOAD_EVM_BALANCES_ACTION');
