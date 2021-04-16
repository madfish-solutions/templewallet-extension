import { localForger } from "@taquito/local-forging";
import { TezosToolkit } from "@taquito/taquito";
import { Estimate } from "@taquito/taquito/dist/types/contract/estimate";

import { INCREASE_STORAGE_FEE_VARIANTS } from "lib/temple/defaults";
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
    const tezos = new TezosToolkit(networkRpc);

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
        (e) =>
          ({
            ...e,
            burnFeeMutez: e.burnFeeMutez,
            consumedMilligas: e.consumedMilligas,
            gasLimit: e.gasLimit,
            minimalFeeMutez: e.minimalFeeMutez,
            storageLimit: e.storageLimit,
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

export function increaseStorageOpParmas(
  opParams: any[],
  estimates?: Estimate[],
  increaseStorageFee?: number
) {
  if (
    estimates &&
    increaseStorageFee &&
    INCREASE_STORAGE_FEE_VARIANTS.includes(increaseStorageFee)
  ) {
    try {
      const storageIncreaseFactor = (100 + increaseStorageFee) / 100;
      return opParams.map((op, i) => {
        const storageLimit = estimates[i]?.storageLimit;
        return storageLimit
          ? {
              ...op,
              storageLimit: Math.ceil(storageLimit * storageIncreaseFactor),
            }
          : op;
      });
    } catch {
      return opParams;
    }
  }

  return opParams;
}
