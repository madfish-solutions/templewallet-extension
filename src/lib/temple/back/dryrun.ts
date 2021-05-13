import { localForger } from "@taquito/local-forging";
import { TezosToolkit } from "@taquito/taquito";
import { Estimate } from "@taquito/taquito/dist/types/contract/estimate";

import { FastRpcClient } from "lib/taquito-fast-rpc";
import { formatOpParamsBeforeSend, michelEncoder } from "lib/temple/helpers";
import { ReadOnlySigner } from "lib/temple/read-only-signer";

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
    const tezos = new TezosToolkit(new FastRpcClient(networkRpc));

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
        tezos.contract
          .batch(formated)
          .send()
          .catch(() => undefined),
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
      const rawToSign = await localForger.parse(bytesToSign);
      return { bytesToSign, rawToSign, estimates };
    }

    return null;
  } catch {
    return null;
  }
}

export function buildFinalOpParmas(
  opParams: any[],
  estimates?: Estimate[],
  modifiedStorageLimit?: number
) {
  if (estimates) {
    opParams = opParams.map((op, i) => ({
      ...op,
      storageLimit: estimates[i]?.storageLimit,
    }));
  }

  if (modifiedStorageLimit !== undefined && opParams.length < 2) {
    opParams[0].storageLimit = modifiedStorageLimit;
  }

  return opParams;
}
