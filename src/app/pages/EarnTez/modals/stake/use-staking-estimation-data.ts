import { useCallback } from 'react';

import { TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { useTypedSWR } from 'lib/swr';
import { TezosNetworkEssentials } from 'temple/networks';

import { estimateStaking } from '../../estimate-staking';

import { ReviewData } from './types';

export const useStakingEstimationData = (
  { amount, account, network }: Omit<ReviewData, 'onConfirm' | 'network'> & { network: TezosNetworkEssentials },
  tezos: TezosToolkit,
  tezBalance: BigNumber
) => {
  const estimate = useCallback(
    () => estimateStaking(account, tezos, tezBalance, amount),
    [account, amount, tezBalance, tezos]
  );

  return useTypedSWR(
    ['estimate-staking', amount.toFixed(), account.address, tezBalance.toFixed(), network.rpcBaseURL],
    estimate
  );
};
