import { useCallback } from 'react';

import { TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { useTypedSWR } from 'lib/swr';

import { estimateStaking } from '../../estimate-staking';

import { ReviewData } from './types';

export const useStakingEstimationData = (
  { amount, account }: Omit<ReviewData, 'onConfirm' | 'network'>,
  tezos: TezosToolkit,
  tezBalance: BigNumber
) => {
  const estimate = useCallback(
    () => estimateStaking(account, tezos, tezBalance, amount),
    [account, amount, tezBalance, tezos]
  );

  return useTypedSWR(['estimate-staking', amount.toFixed(), account.address, tezBalance.toFixed()], estimate);
};
