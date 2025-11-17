import { createReducer } from '@reduxjs/toolkit';

import {
  loadEvmBalanceOnChainActions,
  processLoadedEvmAssetsBalancesAction,
  processLoadedOnchainBalancesAction
} from './actions';
import { EvmBalancesInitialState, EvmBalancesStateInterface } from './state';
import { getTokenSlugBalanceRecords, prepareAssigning } from './utils';

export const evmBalancesReducer = createReducer<EvmBalancesStateInterface>(EvmBalancesInitialState, builder => {
  builder.addCase(processLoadedEvmAssetsBalancesAction, (state, { payload }) => {
    const { balancesAtomic, dataTimestamps } = state;
    const { publicKeyHash, chainId, data, assetsToPreventBalanceErase } = payload;
    prepareAssigning(state, publicKeyHash);

    const { balances: newBalances, timestamps: newTimestamps } = getTokenSlugBalanceRecords(
      data.items,
      chainId,
      new Date(data.chain_tip_signed_at ?? data.updated_at).getTime(),
      dataTimestamps[publicKeyHash][chainId],
      balancesAtomic[publicKeyHash][chainId],
      assetsToPreventBalanceErase
    );
    balancesAtomic[publicKeyHash][chainId] = newBalances;
    dataTimestamps[publicKeyHash][chainId] = newTimestamps;
  });

  builder.addCase(loadEvmBalanceOnChainActions.success, (state, { payload }) => {
    const { balancesAtomic, dataTimestamps } = state;
    const { network, assetSlug, account, balance, timestamp } = payload;
    const { chainId } = network;
    prepareAssigning(state, account, chainId);

    const prevTimestamp = dataTimestamps[account][chainId][assetSlug] ?? 0;
    if (prevTimestamp <= timestamp) {
      balancesAtomic[account][chainId][assetSlug] = balance.toFixed();
      dataTimestamps[account][chainId][assetSlug] = timestamp;
    }
  });

  builder.addCase(processLoadedOnchainBalancesAction, (state, { payload }) => {
    const { balancesAtomic, dataTimestamps } = state;
    const { balances, timestamp, account, chainId } = payload;
    prepareAssigning(state, account, chainId);

    const chainBalances = balancesAtomic[account][chainId];
    const chainTimestamps = dataTimestamps[account][chainId];
    for (const assetSlug in balances) {
      const prevTimestamp = chainTimestamps[assetSlug] ?? 0;
      if (prevTimestamp <= timestamp) {
        chainBalances[assetSlug] = balances[assetSlug];
        chainTimestamps[assetSlug] = timestamp;
      }
    }
  });
});
