import BigNumber from 'bignumber.js';
import { noop } from 'lodash';

import { AccountForEvm } from 'temple/accounts';
import { EvmNetworkEssentials } from 'temple/networks';

import { EVERSTAKE_SOURCE_ID } from '../constants';
import { makeUseEstimationData } from '../estimate-earn-operation';
import { makeEthereumToolkit } from '../utils';

import { ReviewData } from './types';

export const getUnstakingParams = (account: AccountForEvm, network: EvmNetworkEssentials, amount: BigNumber) => {
  const toolkit = makeEthereumToolkit(network);
  const tryGetParams = (allowedInterchangeNum: number) =>
    toolkit.unstake(account.address, amount.toFixed(), allowedInterchangeNum, EVERSTAKE_SOURCE_ID);

  return tryGetParams(65535).catch(error => {
    console.error(error);

    return tryGetParams(0);
  });
};

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
