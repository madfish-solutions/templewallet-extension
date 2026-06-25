import { localForger } from '@taquito/local-forging';
import { ForgeOperationsParams } from '@taquito/rpc';
import { TezosToolkit, TezosOperationError, Estimate, getRevealFee } from '@taquito/taquito';
import { ProhibitedActionError } from '@taquito/utils';
import { omit } from 'lodash';

import { FEE_PER_GAS_UNIT } from 'lib/constants';
import { formatOpParamsBeforeSend } from 'lib/temple/helpers';
import { ReadOnlySigner } from 'lib/temple/read-only-signer';
import { SerializedEstimate } from 'lib/temple/types';
import { serializeEstimate } from 'lib/utils/serialize-estimate';
import { getParamsWithCustomGasLimitFor3RouteSwap } from 'lib/utils/swap.utils';
import { TezosNetworkEssentials } from 'temple/networks';
import { michelEncoder, getTezosRpcClient } from 'temple/tezos';

import { provePossession } from './prove-possession';

interface DryRunParams {
  opParams: any[];
  network: TezosNetworkEssentials;
  sourcePkh: string;
  sourcePublicKey: string;
}

export interface DryRunResult {
  error?: Array<any>;
  result?: {
    bytesToSign?: string;
    rawToSign: ForgeOperationsParams;
    estimates: Array<SerializedEstimate>;
    opParams: any;
  };
}

const MAX_GAS_EXHAUSTION_RETRIES = 3;

/**
 * Taquito patches operations missing gas limits with an equal share of the block gas, which can
 * starve a gas-heavy operation in a batch (see getParamsWithCustomGasLimitFor3RouteSwap
 * for the proactive fix covering 3Route swaps). For other batch shapes, reuse the simulation's own
 * hint: the error reports which operation ran out of gas and the limit it ran with, so double that
 * limit and retry.
 */
function getDoubledGasOpParams(opParams: any[], estimationError: unknown) {
  if (
    !(estimationError instanceof TezosOperationError) ||
    !estimationError.errors.some(err => err.id.includes('gas_exhausted'))
  ) {
    return null;
  }

  const { operationsWithResults } = estimationError;
  const revealOffset = operationsWithResults.length - opParams.length;
  if (revealOffset !== 0 && revealOffset !== 1) return null;

  const firstSkippedIndex = operationsWithResults.findIndex(
    op => 'metadata' in op && 'operation_result' in op.metadata && op.metadata.operation_result.status === 'skipped'
  );
  // An internal operation of this operation may be marked as failed but this one as backtracked
  const failedResultIndex = firstSkippedIndex === -1 ? operationsWithResults.length - 1 : firstSkippedIndex - 1;
  const failedOpIndex = failedResultIndex - revealOffset;
  const failedOperationWithResult = operationsWithResults[failedResultIndex];

  if (failedOpIndex < 0 || !failedOperationWithResult || !('gas_limit' in failedOperationWithResult)) return null;

  return {
    failedOpIndex,
    opParams: opParams.map((op, index) =>
      index === failedOpIndex
        ? { ...op, gasLimit: Math.max(op.gasLimit ?? 0, Number(failedOperationWithResult.gas_limit)) * 2 }
        : op
    )
  };
}

export async function dryRunOpParams({
  opParams,
  network,
  sourcePkh,
  sourcePublicKey
}: DryRunParams): Promise<DryRunResult | null> {
  try {
    const tezos = new TezosToolkit(getTezosRpcClient(network));

    let bytesToSign: string | undefined;
    const signer = new ReadOnlySigner(
      sourcePkh,
      sourcePublicKey,
      digest => {
        bytesToSign = digest;
      },
      () => {
        if (!sourcePkh.startsWith('tz4')) {
          throw new ProhibitedActionError('Only BLS keys can prove possession');
        }

        return provePossession(sourcePkh);
      }
    );

    tezos.setSignerProvider(signer);
    tezos.setPackerProvider(michelEncoder);

    let serializedEstimates: SerializedEstimate[] | undefined;
    let error: any = [];
    try {
      const noExplicitGasLimits = opParams.every(op => op.gasLimit === undefined);
      const preparedOpParams = noExplicitGasLimits
        ? await getParamsWithCustomGasLimitFor3RouteSwap(tezos, sourcePkh, opParams)
        : opParams;
      const formatted = preparedOpParams.map(operation => formatOpParamsBeforeSend(operation, sourcePkh));

      let [estimationResult] = await Promise.allSettled([tezos.estimate.batch(formatted)]);
      let [contractBatchResult] = await Promise.allSettled([tezos.contract.batch(formatted).send()]);

      let retryOpParams = preparedOpParams;
      let attemptCounter = 0;
      let prevFailedOpIndex = -1;
      while (
        attemptCounter < MAX_GAS_EXHAUSTION_RETRIES &&
        estimationResult.status === 'rejected' &&
        contractBatchResult.status === 'rejected'
      ) {
        const rescue = getDoubledGasOpParams(retryOpParams, estimationResult.reason);
        if (!rescue) break;

        retryOpParams = rescue.opParams;
        attemptCounter = rescue.failedOpIndex > prevFailedOpIndex ? 0 : attemptCounter + 1;
        prevFailedOpIndex = Math.max(rescue.failedOpIndex, prevFailedOpIndex);

        const retryFormatted = retryOpParams.map(operation => formatOpParamsBeforeSend(operation, sourcePkh));
        [estimationResult] = await Promise.allSettled([tezos.estimate.batch(retryFormatted)]);
        [contractBatchResult] = await Promise.allSettled([tezos.contract.batch(retryFormatted).send()]);
      }

      if (estimationResult.status === 'rejected' && contractBatchResult.status === 'rejected') {
        error = [
          { ...estimationResult.reason, isError: true },
          { ...contractBatchResult.reason, isError: true }
        ];
      }

      if (estimationResult.status === 'fulfilled') {
        let revealEstimate: Estimate | undefined;
        const otherEstimates = Array.from(estimationResult.value);

        if (estimationResult.value.length === opParams.length + 1) {
          revealEstimate = otherEstimates.shift();
        }

        serializedEstimates = otherEstimates.map((e, i) => ({
          ...serializeEstimate(e),
          suggestedFeeMutez:
            e.suggestedFeeMutez +
            (opParams[i]?.gasLimit ? Math.ceil((opParams[i].gasLimit - e.gasLimit) * FEE_PER_GAS_UNIT) : 0),
          storageLimit: opParams[i]?.storageLimit ? +opParams[i].storageLimit : e.storageLimit
        }));

        if (revealEstimate) {
          // Taquito attaches getRevealFee() to the auto-prepended reveal at send time, which can exceed
          // the simulation-based estimate; report the fee that will actually be paid.
          serializedEstimates.unshift({
            ...serializeEstimate(revealEstimate),
            suggestedFeeMutez: Math.max(revealEstimate.suggestedFeeMutez, getRevealFee(sourcePkh))
          });
        }
      }
    } catch (e) {
      console.error(e);
    }

    if (bytesToSign && serializedEstimates) {
      const withReveal = serializedEstimates.length === opParams.length + 1;
      const rawToSign = await localForger.parse(bytesToSign);
      return {
        result: {
          bytesToSign,
          rawToSign,
          estimates: serializedEstimates,
          opParams: opParams.map((op, i) => {
            const eIndex = withReveal ? i + 1 : i;
            // opParams previously formatted using withoutFeesOverride, reformating here
            return {
              ...omit(op, ['storage_limit', 'gas_limit']),
              fee: op.fee ?? serializedEstimates?.[eIndex].suggestedFeeMutez,
              gasLimit: op.gas_limit ?? serializedEstimates?.[eIndex].gasLimit,
              storageLimit: op.storage_limit ?? serializedEstimates?.[eIndex].storageLimit
            };
          })
        }
      };
    }

    return error.length ? { error } : null;
  } catch (e) {
    return { error: [e] };
  }
}
