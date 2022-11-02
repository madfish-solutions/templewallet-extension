import { EmptyObject } from '@reduxjs/toolkit';

export interface WalletState {
  counter: number;
}

export const walletInitialState: WalletState = {
  counter: 0
};

export interface WalletRootState extends EmptyObject {
  wallet: WalletState;
}
