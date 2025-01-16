import { localForger } from '@taquito/local-forging';
import { ForgeOperationsParams } from '@taquito/rpc';
import { BatchOperation, Estimate, TezosToolkit } from '@taquito/taquito';
import { omit } from 'lodash';

import { formatOpParamsBeforeSend } from 'lib/temple/helpers';
import { ReadOnlySigner } from 'lib/temple/read-only-signer';
import { SerializedEstimate } from 'lib/temple/types';
import { serializeEstimate } from 'lib/utils/serialize-estimate';
import { michelEncoder, getTezosFastRpcClient } from 'temple/tezos';

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
    estimates: Array<SerializedEstimate>;
    opParams: any;
  };
}

interface SerializedError {
  isError: true;
  [key: string]: unknown;
}

const FEE_PER_GAS_UNIT = 0.1;

export async function dryRunOpParams({
  opParams,
  networkRpc,
  sourcePkh,
  sourcePublicKey
}: DryRunParams): Promise<DryRunResult | null> {
  try {
    const tezos = new TezosToolkit(getTezosFastRpcClient(networkRpc));

    let bytesToSign: string | undefined;
    const signer = new ReadOnlySigner(sourcePkh, sourcePublicKey, digest => {
      bytesToSign = digest;
    });

    tezos.setSignerProvider(signer);
    tezos.setPackerProvider(michelEncoder);

    let estimates: SerializedEstimate[] | undefined;
    let error: any = [];
    try {
      const formatted = opParams.map(formatOpParamsBeforeSend);
      const result: [Estimate[] | SerializedError, BatchOperation | SerializedError] = [
        await tezos.estimate.batch(formatted).catch(e => ({ ...e, isError: true })),
        await tezos.contract
          .batch(formatted)
          .send()
          .catch(e => ({ ...e, isError: true }))
      ];
      if (result.every(x => 'isError' in x && x.isError)) {
        error = result;
      }
      estimates = Array.isArray(result[0])
        ? result[0].map((e, i) => ({
            ...serializeEstimate(e),
            storageLimit: opParams[i]?.storageLimit ? +opParams[i].storageLimit : e.storageLimit,
            suggestedFeeMutez:
              e.suggestedFeeMutez +
              (opParams[i]?.gasLimit ? Math.ceil((opParams[i].gasLimit - e.gasLimit) * FEE_PER_GAS_UNIT) : 0)
          }))
        : undefined;
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
