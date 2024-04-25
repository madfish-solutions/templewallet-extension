import { createReducer } from '@reduxjs/toolkit';

import { loadEVMDataActions } from './actions';
import { EvmInitialState, EvmStateInterface } from './state';

export const evmReducer = createReducer<EvmStateInterface>(EvmInitialState, builder => {
  builder.addCase(loadEVMDataActions.submit, state => {
    state.isDataLoading = true;
  });
  builder.addCase(loadEVMDataActions.success, state => {
    state.isDataLoading = false;
  });
  builder.addCase(loadEVMDataActions.fail, state => {
    state.isDataLoading = false;
  });
});
