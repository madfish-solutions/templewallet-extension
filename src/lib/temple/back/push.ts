import { localForger } from "@taquito/local-forging";
import { TezosToolkit, OperationBatch, BatchOperation } from "@taquito/taquito";
import { Estimate } from "@taquito/taquito/dist/types/contract/estimate";

import { createQueue } from "lib/queue";
import {
  getCounter,
  setCounter,
  getReleasedCounter,
  setReleasedCounter,
  applyTezosCounters,
} from "lib/temple/counters";
import {
  formatOpParamsBeforeSend,
  michelEncoder,
  loadFastRpcClient,
} from "lib/temple/helpers";
import { ReadOnlySigner } from "lib/temple/read-only-signer";

const enqueueSend = createQueue();

export async function sendBatch(
  batch: OperationBatch
): Promise<BatchOperation> {
  return enqueueSend(async () => {
    const pkh = await batch.signer.publicKeyHash();

    try {
      const op = await batch.send();
      // Mark counter as released
      setReleasedCounter(pkh, getCounter(pkh));
      return op;
    } catch (err) {
      // Rollback if fails
      setCounter(pkh, getReleasedCounter(pkh));
      throw err;
    }
  });
}

export type DryRunParams = {
  opParams: any[];
  networkRpc: string;
  sourcePkh: string;
  sourcePublicKey: string;
};

export async function dryRunOpParams({
  opParams,
  networkRpc,
  sourcePkh,
  sourcePublicKey,
}: DryRunParams) {
  try {
    const tezos = new TezosToolkit(loadFastRpcClient(networkRpc));
    applyTezosCounters(tezos);

    let bytesToSign: string | undefined;
    const signer = new ReadOnlySigner(sourcePkh, sourcePublicKey, (digest) => {
      bytesToSign = digest;
    });

    tezos.setSignerProvider(signer);
    tezos.setPackerProvider(michelEncoder);

    let estimates: Estimate[] | undefined;
    try {
      const formated = opParams.map(formatOpParamsBeforeSend);
      const result = await Promise.all([
        sendBatch(tezos.contract.batch(formated)).catch(() => undefined),
        tezos.estimate.batch(formated).catch(() => undefined),
      ]);
      estimates = result[1]?.map(
        (e, i) =>
          ({
            ...e,
            burnFeeMutez: e.burnFeeMutez,
            consumedMilligas: e.consumedMilligas,
            gasLimit: e.gasLimit,
            minimalFeeMutez: e.minimalFeeMutez,
            storageLimit: opParams[i]?.storageLimit
              ? +opParams[i].storageLimit
              : e.storageLimit,
            suggestedFeeMutez: e.suggestedFeeMutez,
            totalCost: e.totalCost,
            usingBaseFeeMutez: e.usingBaseFeeMutez,
          } as Estimate)
      );
    } catch {}

    if (bytesToSign && estimates) {
      const withReveal = estimates.length === opParams.length + 1;
      const rawToSign = await localForger.parse(bytesToSign);
      return {
        bytesToSign,
        rawToSign,
        estimates,
        opParams: opParams.map((op, i) => {
          const eIndex = withReveal ? i + 1 : i;
          return {
            ...op,
            fee: op.fee ?? estimates?.[eIndex].suggestedFeeMutez,
            gasLimit: op.gasLimit ?? estimates?.[eIndex].gasLimit,
            storageLimit: op.storageLimit ?? estimates?.[eIndex].storageLimit,
          };
        }),
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function buildFinalOpParmas(
  opParams: any[],
  modifiedTotalFee?: number,
  modifiedStorageLimit?: number
) {
  if (modifiedTotalFee !== undefined) {
    opParams = opParams.map((op) => ({ ...op, fee: 0 }));
    opParams[opParams.length - 1].fee = modifiedTotalFee;
  }

  if (modifiedStorageLimit !== undefined && opParams.length < 2) {
    opParams[0].storageLimit = modifiedStorageLimit;
  }

  return opParams;
}
