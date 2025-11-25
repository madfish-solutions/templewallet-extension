import BigNumber from 'bignumber.js';
// import { noop } from 'lodash';

import { AccountForEvm } from 'temple/accounts';
import { EvmNetworkEssentials } from 'temple/networks';

// import { makeEstimateOperation, makeGetRawOperationEstimate } from './estimate-earn-operation';
import { makeEthereumToolkit } from './utils';

export const getStakingParams = async (account: AccountForEvm, network: EvmNetworkEssentials, amount: BigNumber) => {
  const { from, to, value, gasLimit, data } = await makeEthereumToolkit(network).stake(
    account.address,
    amount.toFixed(),
    '25'
  );

  return {
    data,
    from,
    gas: BigInt(gasLimit),
    to,
    value: BigInt(value.toFixed())
  };
};

/* const getRawStakingEstimate = makeGetRawOperationEstimate(getStakingParams);

export const estimateStaking = makeEstimateOperation<[BigNumber], [BigNumber]>(getRawStakingEstimate, noop, err => {
  throw err;
}); */
