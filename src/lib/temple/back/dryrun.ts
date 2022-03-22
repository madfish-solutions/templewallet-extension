import { localForger } from '@taquito/local-forging';
import { TezosToolkit } from '@taquito/taquito';
import { Estimate } from '@taquito/taquito/dist/types/contract/estimate';

import { formatOpParamsBeforeSend, michelEncoder, loadFastRpcClient } from 'lib/temple/helpers';
import { ReadOnlySigner } from 'lib/temple/read-only-signer';

export type DryRunParams = {
  opParams: any[];
  networkRpc: string;
  sourcePkh: string;
  sourcePublicKey: string;
};

const FEE_PER_GAS_UNIT = 0.1;

export async function dryRunOpParams({ opParams, networkRpc, sourcePkh, sourcePublicKey }: DryRunParams) {
  try {
    const tezos = new TezosToolkit(loadFastRpcClient(networkRpc));

    let bytesToSign: string | undefined;
    const signer = new ReadOnlySigner(sourcePkh, sourcePublicKey, digest => {
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
          .catch(e => ({ ...e, isError: true })),
        tezos.estimate.batch(formated).catch(e => ({ ...e, isError: true }))
      ]);
      if (!result.some(x => x.isError)) {
        estimates = result[1]?.map(
          (e: any, i: number) =>
            ({
              ...e,
              burnFeeMutez: e.burnFeeMutez,
              consumedMilligas: e.consumedMilligas,
              gasLimit: e.gasLimit,
              minimalFeeMutez: e.minimalFeeMutez,
              storageLimit: opParams[i]?.storageLimit ? +opParams[i].storageLimit : e.storageLimit,
              suggestedFeeMutez:
                e.suggestedFeeMutez +
                (opParams[i]?.gasLimit ? Math.ceil((opParams[i].gasLimit - e.gasLimit) * FEE_PER_GAS_UNIT) : 0),
              totalCost: e.totalCost,
              usingBaseFeeMutez: e.usingBaseFeeMutez
            } as Estimate)
        );
      } else {
        return result;
      }
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
            storageLimit: op.storageLimit ?? estimates?.[eIndex].storageLimit
          };
        })
      };
    }

    return null;
  } catch {
    return null;
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
