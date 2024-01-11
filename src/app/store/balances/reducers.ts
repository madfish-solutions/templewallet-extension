import { createReducer } from '@reduxjs/toolkit';

import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { getKeyForBalancesRecord } from 'lib/balances';
import { createEntity } from 'lib/store/entity.utils';

import { loadNativeTokenBalanceFromTzktAction, loadTokensBalancesFromTzktAction } from './actions';
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

  builder.addCase(loadNativeTokenBalanceFromTzktAction.submit, (state, { payload }) => {
    const key = getKeyForBalancesRecord(payload.publicKeyHash, payload.chainId);

    state.balancesAtomic[key] = createEntity(state.balancesAtomic[key]?.data ?? {}, true);
  });
  builder.addCase(loadNativeTokenBalanceFromTzktAction.success, (state, { payload }) => {
    state.balancesAtomic = {
      ...state.balancesAtomic,
      [getKeyForBalancesRecord(payload.publicKeyHash, payload.chainId)]: createEntity(
        { [TEZ_TOKEN_SLUG]: payload.balance },
        false
      )
    };
  });
  builder.addCase(loadNativeTokenBalanceFromTzktAction.fail, (state, { payload }) => {
    const key = getKeyForBalancesRecord(payload.publicKeyHash, payload.chainId);

    state.balancesAtomic[key] = createEntity(state.balancesAtomic[key]?.data ?? {}, false, payload.error);
  });
});
