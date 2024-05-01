import { createReducer } from '@reduxjs/toolkit';

import { proceedLoadedEvmTokensBalancesAction } from './actions';
import { EvmTokensBalancesInitialState, EvmTokensBalancesStateInterface } from './state';
import { getTokenSlugBalanceRecord } from './utils';

export const evmTokensBalancesReducer = createReducer<EvmTokensBalancesStateInterface>(
  EvmTokensBalancesInitialState,
  builder => {
    builder.addCase(proceedLoadedEvmTokensBalancesAction, ({ balancesAtomic }, { payload }) => {
      const { publicKeyHash, chainId, data } = payload;

      if (!balancesAtomic[publicKeyHash]) balancesAtomic[publicKeyHash] = {};
      const accountBalances = balancesAtomic[publicKeyHash];

      accountBalances[chainId] = Object.assign(
        {},
        accountBalances[chainId] ?? {},
        getTokenSlugBalanceRecord(data.items)
      );
    });
  }
);
