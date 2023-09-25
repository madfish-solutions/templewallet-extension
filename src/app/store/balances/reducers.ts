import { createReducer } from '@reduxjs/toolkit';

import { getKeyForBalancesRecord } from 'lib/balances';
import { createEntity } from 'lib/store/entity.utils';

import { loadTokensBalancesFromTzktAction, putTokensBalancesAction } from './actions';
import { balancesInitialState } from './state';

export const balancesReducer = createReducer(balancesInitialState, builder => {
  builder.addCase(loadTokensBalancesFromTzktAction.submit, (state, { payload }) => {
    const key = getKeyForBalancesRecord(payload.publicKeyHash, payload.chainId);

    const current = state.balancesAtomic[key];

    if (current) current.isLoading = true;
    else state.balancesAtomic[key] = createEntity({}, true);
  });

  builder.addCase(loadTokensBalancesFromTzktAction.success, (state, { payload }) => {
    const key = getKeyForBalancesRecord(payload.publicKeyHash, payload.chainId);

    state.balancesAtomic = {
      ...state.balancesAtomic,
      [key]: createEntity(payload.balances, false)
    };
  });

  builder.addCase(loadTokensBalancesFromTzktAction.fail, (state, { payload }) => {
    const key = getKeyForBalancesRecord(payload.publicKeyHash, payload.chainId);

    state.balancesAtomic = {
      ...state.balancesAtomic,
      [key]: createEntity({}, false, payload.error)
    };
  });

  builder.addCase(putTokensBalancesAction, (state, { payload }) => {
    if (Object.keys(payload.balances).length < 1) return;

    const key = getKeyForBalancesRecord(payload.publicKeyHash, payload.chainId);

    const current = state.balancesAtomic[key];

    state.balancesAtomic = {
      ...state.balancesAtomic,
      [key]: createEntity({ ...current?.data, ...payload.balances }, current?.isLoading ?? false)
    };
  });
});
