import type { Draft } from '@reduxjs/toolkit';

import { createEntity } from 'lib/store';

import type { BalancesStateInterface } from './state';

export const getKeyForBalancesRecord = (publicKeyHash: string, chainId: string) => `${publicKeyHash}_${chainId}`;

export const parseKeyForBalancesRecord = <T = string>(key: string) => key.split('_') as [publicKeyHash: T, chainId: T];

export const retrieveBalancesRecord = (
  state: Draft<BalancesStateInterface>,
  publicKeyHash: string,
  chainId: string
) => {
  const key = getKeyForBalancesRecord(publicKeyHash, chainId);

  if (!state.balancesAtomic[key]) state.balancesAtomic[key] = createEntity({});

  return state.balancesAtomic[key];
};

/** (!) Mutates & returns object */
export const fixBalances = (balances: StringRecord) => {
  // Apply any necessary balance fixes here

  return balances;
};
