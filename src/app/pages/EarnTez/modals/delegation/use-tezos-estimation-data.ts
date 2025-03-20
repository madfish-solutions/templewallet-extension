import { useCallback } from 'react';

import { TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { useTypedSWR } from 'lib/swr';
import { AccountForTezos } from 'temple/accounts';

import { estimateDelegation } from './estimate-delegation';

export const useTezosEstimationData = (
  bakerPkh: string,
  tezos: TezosToolkit,
  account: AccountForTezos,
  tezBalance: BigNumber
) => {
  const estimate = useCallback(
    () => estimateDelegation(account, tezBalance, bakerPkh, tezos),
    [account, bakerPkh, tezBalance, tezos]
  );

  return useTypedSWR(['estimate-delegation', bakerPkh, account.address, tezBalance.toFixed()], estimate);
};
