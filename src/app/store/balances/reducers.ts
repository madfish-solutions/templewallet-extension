import { createReducer } from '@reduxjs/toolkit';

import { getKeyForBalancesRecord } from 'lib/balances';
import { createEntity } from 'lib/store/utils/entity.utils';

import { loadTokensBalancesFromChainAction, loadTokensBalancesFromTzktAction } from './actions';
import { balancesInitialState } from './state';

export const balancesReducer = createReducer(balancesInitialState, builder => {
  builder.addCase(loadTokensBalancesFromTzktAction.submit, (state, { payload }) => {
    const key = getKeyForBalancesRecord(payload.publicKeyHash, payload.chainId);

    state.balancesAtomic[key] = createEntity(state.balancesAtomic[key]?.data ?? {}, true);
  });
  builder.addCase(loadTokensBalancesFromTzktAction.success, (state, { payload }) => {
    state.balancesAtomic = {
      ...state.balancesAtomic,
      [getKeyForBalancesRecord(payload.publicKeyHash, payload.chainId)]: createEntity(payload.balances, false)
    };
  });
  builder.addCase(loadTokensBalancesFromTzktAction.fail, (state, { payload }) => {
    state.balancesAtomic = {
      ...state.balancesAtomic,
      [getKeyForBalancesRecord(payload.publicKeyHash, payload.chainId)]: createEntity({}, false, payload.error)
    };
  });
  builder.addCase(loadTokensBalancesFromChainAction.submit, (state, { payload }) => {
    state.balancesAtomic = {
      ...state.balancesAtomic,
      [getKeyForBalancesRecord(payload.publicKeyHash, payload.chainId)]: createEntity({}, true)
    };
  });
  builder.addCase(loadTokensBalancesFromChainAction.success, (state, { payload }) => {
    state.balancesAtomic = {
      ...state.balancesAtomic,
      [getKeyForBalancesRecord(payload.publicKeyHash, payload.chainId)]: createEntity(payload.balances, false)
    };
  });
  builder.addCase(loadTokensBalancesFromChainAction.fail, (state, { payload }) => {
    state.balancesAtomic = {
      ...state.balancesAtomic,
      [getKeyForBalancesRecord(payload.publicKeyHash, payload.chainId)]: createEntity({}, false, payload.error)
    };
  });
});
