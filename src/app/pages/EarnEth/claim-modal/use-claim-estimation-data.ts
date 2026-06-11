import { noop } from 'lodash';

import { makeEthereumToolkit } from 'lib/utils/eth-staking';
import { AccountForEvm } from 'temple/accounts';
import { EvmNetworkEssentials } from 'temple/networks';

import { makeUseEstimationData } from '../estimate-earn-operation';
import { EthEarnReviewDataBase } from '../types';

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
