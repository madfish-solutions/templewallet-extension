import { noop } from 'lodash';

import { AccountForEvm } from 'temple/accounts';
import { EvmNetworkEssentials } from 'temple/networks';

import { makeUseEstimationData } from '../estimate-earn-operation';
import { EthEarnReviewDataBase } from '../types';
import { makeEthereumToolkit } from '../utils';

export const getClaimParams = (account: AccountForEvm, network: EvmNetworkEssentials) =>
  makeEthereumToolkit(network).claimWithdrawRequest(account.address);

export const useClaimEstimationData = makeUseEstimationData<[], [], EthEarnReviewDataBase>(
  getClaimParams,
  noop,
  () => [],
  ({ network }, account, ethBalance) => [
    'estimate-eth-claim',
    account.address,
    ethBalance.toFixed(),
    network.rpcBaseURL
  ]
);
