import { createReducer } from '@reduxjs/toolkit';

import { loadEvmBalanceOnChainActions, processLoadedEvmAssetsBalancesAction } from './actions';
import { EvmBalancesInitialState, EvmBalancesStateInterface } from './state';
import { getTokenSlugBalanceRecord } from './utils';

export const evmBalancesReducer = createReducer<EvmBalancesStateInterface>(EvmBalancesInitialState, builder => {
  builder.addCase(processLoadedEvmAssetsBalancesAction, ({ balancesAtomic }, { payload }) => {
    const { publicKeyHash, chainId, data } = payload;
    if (!balancesAtomic[publicKeyHash]) balancesAtomic[publicKeyHash] = {};

    balancesAtomic[publicKeyHash][chainId] = getTokenSlugBalanceRecord(data.items, chainId);
  });

  builder.addCase(loadEvmBalanceOnChainActions.success, ({ balancesAtomic }, { payload }) => {
    const { network, assetSlug, account, balance } = payload;
    const { chainId } = network;
    if (!balancesAtomic[account]) balancesAtomic[account] = {};
    const accountBalances = balancesAtomic[account];

    accountBalances[chainId] = Object.assign({}, accountBalances[chainId] ?? {}, { [assetSlug]: balance.toFixed() });
  });
});
