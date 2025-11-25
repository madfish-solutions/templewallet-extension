import BigNumber from 'bignumber.js';
import { noop } from 'lodash';

import { makeUseEstimationData } from '../estimate-earn-operation';
import { getStakingParams } from '../estimate-staking';

import { ReviewData } from './types';

export const useStakingEstimationData = makeUseEstimationData<[BigNumber], [BigNumber], ReviewData>(
  getStakingParams,
  noop,
  ({ amount }) => [amount],
  ({ amount, network }, account, ethBalance) => [
    'estimate-eth-staking',
    amount.toFixed(),
    account.address,
    ethBalance.toFixed(),
    network.rpcBaseURL
  ]
);
