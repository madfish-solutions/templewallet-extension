import { createReducer } from '@reduxjs/toolkit';

import { proceedLoadedEvmBalancesAction } from './actions';
import { EvmBalancesInitialState } from './state';
import { getTokenSlugBalanceRecord } from './utils';

export const evmBalancesReducer = createReducer(EvmBalancesInitialState, builder => {
  builder.addCase(proceedLoadedEvmBalancesAction, ({ balancesAtomic }, { payload }) => {
    const { publicKeyHash, chainId, data } = payload;

    if (!balancesAtomic[publicKeyHash]) balancesAtomic[publicKeyHash] = {};
    const accountBalances = balancesAtomic[publicKeyHash];

    accountBalances[chainId] = Object.assign({}, accountBalances[chainId] ?? {}, getTokenSlugBalanceRecord(data.items));
  });
});
