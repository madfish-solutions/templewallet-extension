import { createReducer } from '@reduxjs/toolkit';
import { getStoredState, type PersistConfig, type PersistedState, persistReducer } from 'redux-persist';

import { isPersistedState, isRecord } from 'lib/store';
import { ReduxPersistStorage } from 'lib/store/storage';

import {
  loadEvmBalanceOnChainActions,
  processLoadedEvmAssetsBalancesAction,
  processLoadedOnchainBalancesAction,
  markEvmBalancesInitiallyLoadedAction
} from './actions';
import { EvmBalancesInitialState, EvmBalancesStateInterface } from './state';
import { getTokenSlugBalanceRecords, prepareAssigning } from './utils';

const evmBalancesReducer = createReducer<EvmBalancesStateInterface>(EvmBalancesInitialState, builder => {
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

  builder.addCase(markEvmBalancesInitiallyLoadedAction, (state, { payload: { chainId } }) => {
    state.initiallyLoadedChains[chainId] = true;
  });
});

const isEvmBalancesState = (value: unknown): value is EvmBalancesStateInterface =>
  isRecord(value) && isRecord(value.balancesAtomic) && isRecord(value.dataTimestamps);

// Before their first save under the own key (the first launch after the update), balances live in the root state
const getStoredEvmBalances = async (config: PersistConfig<EvmBalancesStateInterface>): Promise<PersistedState> => {
  const stored = await getStoredState(config);
  if (isPersistedState(stored)) return stored;

  const root: unknown = await ReduxPersistStorage.getItem('persist:temple-root');
  const rootCopy = isRecord(root) ? root.evmBalances : undefined;

  return isEvmBalancesState(rootCopy) ? { ...rootCopy, _persist: { version: -1, rehydrated: false } } : undefined;
};

export const evmBalancesPersistedReducer = persistReducer(
  { key: 'root.evmBalances', storage: ReduxPersistStorage, getStoredState: getStoredEvmBalances },
  evmBalancesReducer
);
