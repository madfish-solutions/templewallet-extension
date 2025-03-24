import BigNumber from 'bignumber.js';
import { noop } from 'lodash';

import { makeUseEstimationData } from '../../estimate-earn-operation';
import { getStakingParams } from '../../estimate-staking';

import { ReviewData } from './types';

export const useStakingEstimationData = makeUseEstimationData<[BigNumber], [BigNumber], ReviewData>(
  getStakingParams,
  noop,
  ({ amount }) => [amount],
  ({ amount, network }, account, tezBalance) => [
    'estimate-staking',
    amount.toFixed(),
    account.address,
    tezBalance.toFixed(),
    network.rpcBaseURL
  ]
);
