import { createReducer } from '@reduxjs/toolkit';

import { proceedLoadedEVMBalancesAction } from './actions';
import { EVMBalancesInitialState } from './state';
import { getBalancesAtomicRecord } from './utils';

export const evmBalancesReducer = createReducer(EVMBalancesInitialState, builder => {
  builder.addCase(proceedLoadedEVMBalancesAction, (state, { payload }) => {
    const { publicKeyHash, data } = payload;

    if (data.length === 0) return;

    state.balancesAtomic = getBalancesAtomicRecord(publicKeyHash, data);
  });
});
