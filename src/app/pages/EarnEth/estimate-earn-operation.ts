import { useCallback } from 'react';

import BigNumber from 'bignumber.js';
import { TransactionRequest } from 'viem';

import { useTypedSWR } from 'lib/swr';
import { AccountForEvm } from 'temple/accounts';
import { EvmEstimationData, estimate } from 'temple/evm/estimate';
import { EvmNetworkEssentials } from 'temple/networks';

import { EthEarnReviewDataBase } from './types';

const makeGetRawOperationEstimate =
  <T extends [account: AccountForEvm, network: EvmNetworkEssentials, ...unknown[]]>(
    getParams: (...args: T) => Promise<TransactionRequest>
  ) =>
  async (...args: T) => {
    const [, network] = args;
    const request = await getParams(...args);

    return await estimate(network, request);
  };

const makeEstimateOperation =
  <T extends unknown[], U extends T>(
    getRawEstimate: (account: AccountForEvm, network: EvmNetworkEssentials, ...args: U) => Promise<EvmEstimationData>,
    assertArgs: (args: T) => asserts args is U,
    handleError: (error: any) => EvmEstimationData
  ) =>
  async (account: AccountForEvm, network: EvmNetworkEssentials, ...args: T) => {
    assertArgs(args);

    try {
      return await getRawEstimate(account, network, ...args);
    } catch (err: any) {
      return handleError(err);
    }
  };

type MinEstimationData<D extends EthEarnReviewDataBase> = Omit<D, 'onConfirm' | 'network'> & {
  network: EvmNetworkEssentials;
};

const defaultHandleError: (error: any) => EvmEstimationData = err => {
  throw err;
};

export const makeUseEstimationData = <T extends unknown[], U extends T, D extends EthEarnReviewDataBase>(
  getParams: (account: AccountForEvm, network: EvmNetworkEssentials, ...args: U) => Promise<TransactionRequest>,
  assertArgs: (args: T) => asserts args is U,
  makeRestArgs: (data: MinEstimationData<D>) => T,
  makeSWRKey: (data: MinEstimationData<D>, account: AccountForEvm, ethBalance: BigNumber) => string[],
  handleError: (error: any) => EvmEstimationData = defaultHandleError
) => {
  const estimateOperation = makeEstimateOperation(makeGetRawOperationEstimate(getParams), assertArgs, handleError);

  const useEstimationData = (data: MinEstimationData<D>, network: EvmNetworkEssentials, ethBalance: BigNumber) => {
    const estimate = useCallback(
      () => estimateOperation(data.account, network, ...makeRestArgs(data)),
      [data, network]
    );

    const result = useTypedSWR(makeSWRKey(data, data.account, ethBalance), estimate);

    return result;
  };

  return useEstimationData;
};
