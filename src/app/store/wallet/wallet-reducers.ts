import { createReducer } from '@reduxjs/toolkit';

import { increaseCounterAction } from './wallet-actions';
import { walletInitialState, WalletState } from './wallet-state';

export const walletReducers = createReducer<WalletState>(walletInitialState, builder => {
  builder.addCase(increaseCounterAction, state => ({
    ...state,
    counter: state.counter + 1
  }));
});
