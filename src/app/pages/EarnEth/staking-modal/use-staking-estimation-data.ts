import BigNumber from 'bignumber.js';
import { noop } from 'lodash';

import { AccountForEvm } from 'temple/accounts';
import { EvmNetworkEssentials } from 'temple/networks';

import { EVERSTAKE_SOURCE_ID } from '../constants';
import { makeUseEstimationData } from '../estimate-earn-operation';
import { makeEthereumToolkit } from '../utils';

import { ReviewData } from './types';

export const getStakingParams = (account: AccountForEvm, network: EvmNetworkEssentials, amount: BigNumber) =>
  makeEthereumToolkit(network).stake(account.address, amount.toFixed(), EVERSTAKE_SOURCE_ID);

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
