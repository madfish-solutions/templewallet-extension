import { createReducer } from '@reduxjs/toolkit';

import { loadEvmBalanceOnChainActions, processLoadedEvmAssetsBalancesAction } from './actions';
import { EvmBalancesInitialState, EvmBalancesStateInterface } from './state';
import { getTokenSlugBalanceRecord } from './utils';

export const evmBalancesReducer = createReducer<EvmBalancesStateInterface>(EvmBalancesInitialState, builder => {
  builder.addCase(processLoadedEvmAssetsBalancesAction, ({ balancesAtomic, dataTimestamps }, { payload }) => {
    const { publicKeyHash, chainId, data, timestamp } = payload;
    if (!balancesAtomic[publicKeyHash]) balancesAtomic[publicKeyHash] = {};
    if (!dataTimestamps[publicKeyHash]) dataTimestamps[publicKeyHash] = {};

    balancesAtomic[publicKeyHash][chainId] = getTokenSlugBalanceRecord(data.items, chainId);
    dataTimestamps[publicKeyHash][chainId] = timestamp;
  });

  builder.addCase(loadEvmBalanceOnChainActions.success, ({ balancesAtomic }, { payload }) => {
    const { network, assetSlug, account, balance } = payload;
    const { chainId } = network;
    if (!balancesAtomic[account]) balancesAtomic[account] = {};
    const accountBalances = balancesAtomic[account];

    accountBalances[chainId] = Object.assign({}, accountBalances[chainId] ?? {}, { [assetSlug]: balance.toFixed() });
  });
});
