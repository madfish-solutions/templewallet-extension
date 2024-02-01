import { createReducer } from '@reduxjs/toolkit';

import { TEZ_TOKEN_SLUG } from 'lib/assets';

import { loadGasBalanceActions, loadAssetsBalancesActions, putTokensBalancesAction } from './actions';
import { balancesInitialState } from './state';
import { retrieveBalancesRecord, writeTriedToLoadAssetsBalances, writeTriedToLoadGasBalance } from './utils';

export const balancesReducer = createReducer(balancesInitialState, builder => {
  builder.addCase(loadGasBalanceActions.success, (state, { payload }) => {
    const records = retrieveBalancesRecord(state, payload.publicKeyHash, payload.chainId);

    records.data[TEZ_TOKEN_SLUG] = payload.balance;
    writeTriedToLoadGasBalance(state, payload.publicKeyHash, payload.chainId);
  });

  builder.addCase(loadGasBalanceActions.fail, (state, { payload }) => {
    writeTriedToLoadGasBalance(state, payload.publicKeyHash, payload.chainId);
  });

  builder.addCase(loadAssetsBalancesActions.submit, (state, { payload }) => {
    const records = retrieveBalancesRecord(state, payload.publicKeyHash, payload.chainId);

    records.isLoading = true;
  });

  builder.addCase(loadAssetsBalancesActions.success, (state, { payload }) => {
    const records = retrieveBalancesRecord(state, payload.publicKeyHash, payload.chainId);

    records.data = Object.assign({}, records.data, payload.balances);
    records.isLoading = false;
    delete records.error;
    writeTriedToLoadAssetsBalances(state, payload.publicKeyHash, payload.chainId);
  });

  builder.addCase(loadAssetsBalancesActions.fail, (state, { payload }) => {
    const records = retrieveBalancesRecord(state, payload.publicKeyHash, payload.chainId);

    records.error = payload.error;
    records.isLoading = false;
    writeTriedToLoadAssetsBalances(state, payload.publicKeyHash, payload.chainId);
  });

  builder.addCase(putTokensBalancesAction, (state, { payload }) => {
    if (Object.keys(payload.balances).length < 1) return;

    const records = retrieveBalancesRecord(state, payload.publicKeyHash, payload.chainId);

    records.data = Object.assign({}, records.data, payload.balances);
  });
});
