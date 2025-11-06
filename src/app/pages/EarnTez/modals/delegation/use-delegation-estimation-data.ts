import { useCallback } from 'react';

import { TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { useTypedSWR } from 'lib/swr';

import { getBakerAddress } from '../../utils';

import { estimateDelegation } from './estimate-delegation';
import { ReviewData } from './types';

export const useDelegationEstimationData = (
  { baker, account, network }: ReviewData,
  tezos: TezosToolkit,
  tezBalance: BigNumber
) => {
  const bakerPkh = getBakerAddress(baker);
  const estimate = useCallback(() => estimateDelegation(account, tezos, bakerPkh), [account, bakerPkh, tezos]);

  return useTypedSWR(
    ['estimate-delegation', bakerPkh, account.address, network.chainId, tezBalance.toFixed()],
    estimate
  );
};
