import { createReducer } from '@reduxjs/toolkit';

import { proceedLoadedEvmAssetsBalancesAction } from './actions';
import { EvmBalancesInitialState, EvmBalancesStateInterface } from './state';
import { getTokenSlugBalanceRecord } from './utils';

export const evmBalancesReducer = createReducer<EvmBalancesStateInterface>(EvmBalancesInitialState, builder => {
  builder.addCase(proceedLoadedEvmAssetsBalancesAction, ({ balancesAtomic }, { payload }) => {
    const { publicKeyHash, chainId, data } = payload;

    if (!balancesAtomic[publicKeyHash]) balancesAtomic[publicKeyHash] = {};
    const accountBalances = balancesAtomic[publicKeyHash];

    accountBalances[chainId] = Object.assign({}, accountBalances[chainId] ?? {}, getTokenSlugBalanceRecord(data.items));
  });
});
