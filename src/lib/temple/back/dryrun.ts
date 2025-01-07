import { localForger } from '@taquito/local-forging';
import { ForgeOperationsParams } from '@taquito/rpc';
import { Estimate, TezosToolkit, TezosOperationError } from '@taquito/taquito';
import { omit } from 'lodash';

import { FEE_PER_GAS_UNIT } from 'lib/constants';
import { formatOpParamsBeforeSend } from 'lib/temple/helpers';
import { ReadOnlySigner } from 'lib/temple/read-only-signer';
import { michelEncoder, getTezosFastRpcClient } from 'temple/tezos';

interface DryRunParams {
  opParams: any[];
  networkRpc: string;
  sourcePkh: string;
  sourcePublicKey: string;
  attemptCounter?: number;
  prevFailedOperationIndex?: number;
}

export interface DryRunResult {
  error?: Array<any>;
  result?: {
    bytesToSign?: string;
    rawToSign: ForgeOperationsParams;
    estimates: Array<Estimate>;
    opParams: any;
  };
}

export async function dryRunOpParams({
  opParams,
  networkRpc,
  sourcePkh,
  sourcePublicKey,
  attemptCounter = 0,
  prevFailedOperationIndex = -1
}: DryRunParams): Promise<DryRunResult | null> {
  try {
    const tezos = new TezosToolkit(getTezosFastRpcClient(networkRpc));

    let bytesToSign: string | undefined;
    const signer = new ReadOnlySigner(sourcePkh, sourcePublicKey, digest => {
      bytesToSign = digest;
    });

    tezos.setSignerProvider(signer);
    tezos.setPackerProvider(michelEncoder);

    let estimates: Estimate[] | undefined;
    let error: any = [];
    try {
      const formatted = opParams.map(operation => formatOpParamsBeforeSend(operation, sourcePkh));
      const [estimationResult] = await Promise.allSettled([tezos.estimate.batch(formatted)]);
      const [contractBatchResult] = await Promise.allSettled([tezos.contract.batch(formatted).send()]);
      if (estimationResult.status === 'rejected' && contractBatchResult.status === 'rejected') {
        if (
          estimationResult.reason instanceof TezosOperationError &&
          estimationResult.reason.errors.some(error => error.id.includes('gas_exhausted'))
        ) {
          const { operationsWithResults } = estimationResult.reason;
          const firstSkippedOperationIndex = operationsWithResults.findIndex(
            op =>
              'metadata' in op && 'operation_result' in op.metadata && op.metadata.operation_result.status === 'skipped'
          );
          // An internal operation of this operation may be marked as failed but this one as backtracked
          const failedOperationIndex =
            firstSkippedOperationIndex === -1 ? operationsWithResults.length - 1 : firstSkippedOperationIndex - 1;
          const failedOperationWithResult = operationsWithResults[failedOperationIndex];
          if ('gas_limit' in failedOperationWithResult) {
            const newOpParams = Array.from(opParams);
            newOpParams[failedOperationIndex].gasLimit =
              Math.max(opParams[failedOperationIndex].gasLimit ?? 0, Number(failedOperationWithResult.gas_limit)) * 2;

            if (attemptCounter < 3) {
              return dryRunOpParams({
                opParams: newOpParams,
                networkRpc,
                sourcePkh,
                sourcePublicKey,
                attemptCounter: failedOperationIndex > prevFailedOperationIndex ? 0 : attemptCounter + 1,
                prevFailedOperationIndex: Math.max(failedOperationIndex, prevFailedOperationIndex)
              });
            }
          }
        }
        error = [
          { ...estimationResult.reason, isError: true },
          { ...contractBatchResult.reason, isError: true }
        ];
      }

      if (estimationResult.status === 'fulfilled') {
        estimates = estimationResult.value.map(
          (e, i) =>
            ({
              ...e,
              burnFeeMutez: e.burnFeeMutez,
              consumedMilligas: e.consumedMilligas,
              gasLimit: e.gasLimit,
              minimalFeeMutez: e.minimalFeeMutez,
              suggestedFeeMutez:
                e.suggestedFeeMutez +
                (opParams[i]?.gasLimit ? Math.ceil((opParams[i].gasLimit - e.gasLimit) * FEE_PER_GAS_UNIT) : 0),
              storageLimit: opParams[i]?.storageLimit ? +opParams[i].storageLimit : e.storageLimit,
              totalCost: e.totalCost,
              usingBaseFeeMutez: e.usingBaseFeeMutez
            } as Estimate)
        );
      }
    } catch {}

    if (bytesToSign && estimates) {
      const withReveal = estimates.length === opParams.length + 1;
      const rawToSign = await localForger.parse(bytesToSign);
      return {
        result: {
          bytesToSign,
          rawToSign,
          estimates,
          opParams: opParams.map((op, i) => {
            const eIndex = withReveal ? i + 1 : i;
            // opParams previously formatted using withoutFeesOverride, reformating here
            return {
              ...omit(op, ['storage_limit', 'gas_limit']),
              fee: op.fee ?? estimates?.[eIndex].suggestedFeeMutez,
              gasLimit: op.gas_limit ?? estimates?.[eIndex].gasLimit,
              storageLimit: op.storage_limit ?? estimates?.[eIndex].storageLimit
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

export function buildFinalOpParams(opParams: any[], modifiedTotalFee?: number, modifiedStorageLimit?: number) {
  if (modifiedTotalFee !== undefined) {
    opParams = opParams.map(op => ({ ...op, fee: 0 }));
    opParams[0].fee = modifiedTotalFee;
  }

  if (modifiedStorageLimit !== undefined && opParams.length < 2) {
    opParams[0].storageLimit = modifiedStorageLimit;
  }

  return opParams;
}
