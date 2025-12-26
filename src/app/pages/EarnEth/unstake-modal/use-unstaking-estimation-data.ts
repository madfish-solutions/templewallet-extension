import BigNumber from 'bignumber.js';
import { noop } from 'lodash';

import { AccountForEvm } from 'temple/accounts';
import { EvmNetworkEssentials } from 'temple/networks';

import { EVERSTAKE_SOURCE_ID } from '../constants';
import { makeUseEstimationData } from '../estimate-earn-operation';
import { makeEthereumToolkit } from '../utils';

import { ReviewData } from './types';

export const getUnstakingParams = (account: AccountForEvm, network: EvmNetworkEssentials, amount: BigNumber) =>
  makeEthereumToolkit(network).unstake(account.address, amount.toFixed(), 0, EVERSTAKE_SOURCE_ID);

export const useUnstakingEstimationData = makeUseEstimationData<[BigNumber], [BigNumber], ReviewData>(
  getUnstakingParams,
  noop,
  ({ amount }) => [amount],
  ({ amount, network }, account, ethBalance) => [
    'estimate-eth-unstaking',
    amount.toFixed(),
    account.address,
    ethBalance.toFixed(),
    network.rpcBaseURL
  ]
);
