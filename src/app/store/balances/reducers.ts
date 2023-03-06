import { createReducer } from '@reduxjs/toolkit';

import { createEntity } from 'lib/store/utils/entity.utils';

import { loadTokensBalancesFromChainAction, loadTokensBalancesFromTzktAction } from './actions';
import { balancesInitialState } from './state';

export const balancesReducer = createReducer(balancesInitialState, builder => {
  builder.addCase(loadTokensBalancesFromTzktAction.submit, state => {
    state.balancesAtomic = createEntity({}, true);
  });
  builder.addCase(loadTokensBalancesFromTzktAction.success, (state, { payload }) => {
    state.balancesAtomic = createEntity(payload, false);
  });
  builder.addCase(loadTokensBalancesFromTzktAction.fail, (state, { payload }) => {
    state.balancesAtomic = createEntity({}, false, payload);
  });
  builder.addCase(loadTokensBalancesFromChainAction.submit, state => {
    state.balancesAtomic = createEntity({}, true);
  });
  builder.addCase(loadTokensBalancesFromChainAction.success, (state, { payload }) => {
    state.balancesAtomic = createEntity(payload, false);
  });
  builder.addCase(loadTokensBalancesFromChainAction.fail, (state, { payload }) => {
    state.balancesAtomic = createEntity({}, false, payload);
  });
});
