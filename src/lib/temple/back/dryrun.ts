import { localForger } from '@taquito/local-forging';
import { ForgeOperationsParams } from '@taquito/rpc';
import { Estimate, TezosOperationError, TezosToolkit } from '@taquito/taquito';

import { MINIMAL_FEE_MUTEZ } from 'lib/constants';
import { formatOpParamsBeforeSend, michelEncoder, loadFastRpcClient } from 'lib/temple/helpers';
import { ReadOnlySigner } from 'lib/temple/read-only-signer';

type DryRunParams = {
  opParams: any[];
  networkRpc: string;
  sourcePkh: string;
  sourcePublicKey: string;
};

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
  sourcePublicKey
}: DryRunParams): Promise<DryRunResult | null> {
  try {
    const tezos = new TezosToolkit(loadFastRpcClient(networkRpc));

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
              storageLimit: opParams[i]?.storageLimit ? +opParams[i].storageLimit : e.storageLimit,
              // @ts-expect-error: accessing private field
              suggestedFeeMutez: Math.ceil(e.operationFeeMutez + MINIMAL_FEE_MUTEZ * 1.2),
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
            return {
              ...op,
              fee: op.fee ?? estimates?.[eIndex].suggestedFeeMutez,
              gasLimit: op.gasLimit ?? estimates?.[eIndex].gasLimit,
              storageLimit: op.storageLimit ?? estimates?.[eIndex].storageLimit
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

export function buildFinalOpParmas(opParams: any[], modifiedTotalFee?: number, modifiedStorageLimit?: number) {
  if (modifiedTotalFee !== undefined) {
    opParams = opParams.map(op => ({ ...op, fee: 0 }));
    opParams[0].fee = modifiedTotalFee;
  }

  if (modifiedStorageLimit !== undefined && opParams.length < 2) {
    opParams[0].storageLimit = modifiedStorageLimit;
  }

  return opParams;
}
