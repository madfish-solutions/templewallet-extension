import { useCallback } from 'react';

import { Estimate, TezosToolkit, WalletParamsWithKind, getRevealFee } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { useTypedSWR } from 'lib/swr';
import { TezosEstimationData } from 'lib/temple/front/estimation-data-providers';
import { mutezToTz } from 'lib/temple/helpers';
import { tezosManagerKeyHasManager } from 'lib/tezos';
import { ZERO } from 'lib/utils/numbers';
import { serializeEstimate } from 'lib/utils/serialize-estimate';
import { AccountForTezos } from 'temple/accounts';
import { TezosNetworkEssentials } from 'temple/networks';

import { TezosEarnReviewDataBase } from './types';

export const makeGetRawOperationEstimate =
  <T extends [account: AccountForTezos, tezos: TezosToolkit, ...unknown[]]>(
    getParams: (...args: T) => Promise<WalletParamsWithKind[]>
  ) =>
  async (...args: T) => {
    const [{ address, ownerAddress }, tezos] = args;
    const walletParams = await getParams(...args);

    return await tezos.estimate.batch(walletParams.map(params => ({ ...params, source: ownerAddress || address })));
  };

export const makeEstimateOperation =
  <T extends unknown[], U extends T>(
    getRawEstimate: (account: AccountForTezos, tezos: TezosToolkit, ...args: U) => Promise<Estimate[]>,
    assertArgs: (args: T) => asserts args is U,
    handleError: (error: any) => TezosEstimationData
  ) =>
  async (account: AccountForTezos, tezos: TezosToolkit, ...args: T) => {
    assertArgs(args);

    try {
      const { ownerAddress, address: accountPkh } = account;
      const [estimations, manager] = await Promise.all([
        getRawEstimate(account, tezos, ...args),
        tezos.rpc.getManagerKey(ownerAddress || accountPkh)
      ]);
      const [estimation] = estimations;
      const { burnFeeMutez, suggestedFeeMutez } = estimation;

      const revealFeeMutez =
        tezosManagerKeyHasManager(manager) || ownerAddress ? ZERO : mutezToTz(getRevealFee(accountPkh));
      const estimatedBaseFee = mutezToTz(burnFeeMutez + suggestedFeeMutez).plus(revealFeeMutez);

      return {
        baseFee: estimatedBaseFee,
        gasFee: mutezToTz(suggestedFeeMutez).plus(revealFeeMutez),
        revealFee: revealFeeMutez,
        estimates: [serializeEstimate(estimation)]
      };
    } catch (err: any) {
      return handleError(err);
    }
  };

type MinEstimationData<D extends TezosEarnReviewDataBase> = Omit<D, 'onConfirm' | 'network'> & {
  network: TezosNetworkEssentials;
};

const defaultHandleError: (error: any) => TezosEstimationData = err => {
  throw err;
};

export const makeUseEstimationData = <T extends unknown[], U extends T, D extends TezosEarnReviewDataBase>(
  getParams: (account: AccountForTezos, tezos: TezosToolkit, ...args: U) => Promise<WalletParamsWithKind[]>,
  assertArgs: (args: T) => asserts args is U,
  makeRestArgs: (data: MinEstimationData<D>) => T,
  makeSWRKey: (data: MinEstimationData<D>, account: AccountForTezos, tezBalance: BigNumber) => string[],
  handleError: (error: any) => TezosEstimationData = defaultHandleError
) => {
  const estimateOperation = makeEstimateOperation(makeGetRawOperationEstimate(getParams), assertArgs, handleError);

  const useEstimationData = (data: MinEstimationData<D>, tezos: TezosToolkit, tezBalance: BigNumber) => {
    const estimate = useCallback(() => estimateOperation(data.account, tezos, ...makeRestArgs(data)), [data, tezos]);

    const result = useTypedSWR(makeSWRKey(data, data.account, tezBalance), estimate);

    return result;
  };

  return useEstimationData;
};
