import { createReducer } from '@reduxjs/toolkit';

import { loadEvmBalanceOnChainActions, processLoadedEvmAssetsBalancesAction } from './actions';
import { EvmBalancesInitialState, EvmBalancesStateInterface } from './state';
import { assignBalances, getTokenSlugBalanceRecord } from './utils';

export const evmBalancesReducer = createReducer<EvmBalancesStateInterface>(EvmBalancesInitialState, builder => {
  builder.addCase(processLoadedEvmAssetsBalancesAction, ({ balancesAtomic }, { payload }) => {
    const { publicKeyHash, chainId, data } = payload;
    assignBalances(balancesAtomic, publicKeyHash, chainId, getTokenSlugBalanceRecord(data.items, chainId));
  });

  builder.addCase(loadEvmBalanceOnChainActions.success, ({ balancesAtomic }, { payload }) => {
    const { network, assetSlug, account, balance } = payload;
    const { chainId } = network;
    assignBalances(balancesAtomic, account, chainId, { [assetSlug]: balance.toFixed() });
  });
});
