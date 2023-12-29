import type { Draft } from '@reduxjs/toolkit';

import { createEntity } from 'lib/store';
import { atomsToTokens } from 'lib/temple/helpers';

import type { BalancesStateInterface } from './state';

export const getKeyForBalancesRecord = (publicKeyHash: string, chainId: string) => `${publicKeyHash}_${chainId}`;

export const retrieveBalancesRecord = (
  state: Draft<BalancesStateInterface>,
  publicKeyHash: string,
  chainId: string
) => {
  const key = getKeyForBalancesRecord(publicKeyHash, chainId);

  if (!state.balancesAtomic[key]) state.balancesAtomic[key] = createEntity({});

  return state.balancesAtomic[key];
};

const YUPANA_TOKENS = [
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_0',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_2',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_3',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_4',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_5',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_6'
];
const YUPANA_MULTIPLIER = 18;

/** (!) Mutates & returns object */
export const fixBalances = (balances: StringRecord) => {
  for (const slug of YUPANA_TOKENS) {
    const balance = balances[slug];
    if (balance) balances[slug] = atomsToTokens(balance, YUPANA_MULTIPLIER).toFixed();
  }

  return balances;
};
