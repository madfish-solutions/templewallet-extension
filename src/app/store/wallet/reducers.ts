import { createReducer } from '@reduxjs/toolkit';

import { increaseCounterAction } from './actions';
import { walletInitialState, WalletState } from './state';

export const walletReducer = createReducer<WalletState>(walletInitialState, builder => {
  builder.addCase(increaseCounterAction, state => ({
    ...state,
    counter: state.counter + 1
  }));
});
