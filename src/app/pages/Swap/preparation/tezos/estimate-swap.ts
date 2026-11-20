import { TezosToolkit, WalletParamsWithKind } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { TezosEstimationData } from 'lib/temple/front/estimation-data-providers';
import { mutezToTz } from 'lib/temple/helpers';
import { estimateBatchWithGasRebalance } from 'lib/utils/estimate-with-gas-rebalance';
import { serializeEstimate } from 'lib/utils/serialize-estimate';
import { getParamsWithCustomGasLimitFor3RouteSwap } from 'lib/utils/swap.utils';

export const estimateTezosSwap = async (
  tezos: TezosToolkit,
  sourcePkh: string,
  opParams: WalletParamsWithKind[]
): Promise<TezosEstimationData> => {
  const route3HandledParams = await getParamsWithCustomGasLimitFor3RouteSwap(tezos, sourcePkh, opParams);
  const estimates = await estimateBatchWithGasRebalance(tezos, sourcePkh, route3HandledParams);

  const estimatedBaseFee = mutezToTz(BigNumber.sum(...estimates.map(est => est.suggestedFeeMutez + est.burnFeeMutez)));

  return {
    estimates: estimates.map(serializeEstimate),
    baseFee: estimatedBaseFee,
    gasFee: mutezToTz(BigNumber.sum(...estimates.map(est => est.suggestedFeeMutez))),
    revealFee: mutezToTz(estimates.length > opParams.length ? estimates[0].suggestedFeeMutez : 0)
  };
};
