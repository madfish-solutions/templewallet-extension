import { useCallback } from 'react';

import { TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { useTypedSWR } from 'lib/swr';
import { TezosNetworkEssentials } from 'temple/networks';

import { estimateUnstaking } from './estimate-unstaking';
import { ReviewData } from './types';

export const useUnstakingEstimationData = (
  { amount, account, network }: Omit<ReviewData, 'onConfirm' | 'network'> & { network: TezosNetworkEssentials },
  tezos: TezosToolkit,
  tezBalance: BigNumber
) => {
  const estimate = useCallback(
    () => estimateUnstaking(account, tezos, tezBalance, amount),
    [account, amount, tezBalance, tezos]
  );

  return useTypedSWR(
    ['estimate-unstaking', amount.toFixed(), account.address, tezBalance.toFixed(), network.rpcBaseURL],
    estimate
  );
};
