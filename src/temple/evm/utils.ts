import memoizee from 'memoizee';
import * as ViemChains from 'viem/chains';

import { EvmTxParams, SerializableEvmTxParams, WithSerializedBigint } from './types';

export const getViemChainsList = memoizee(() => Object.values(ViemChains));

function serializeBigints<T extends StringRecord<unknown>>(input: T) {
  const result = {} as WithSerializedBigint<T>;
  for (const key in input) {
    const value = input[key];
    // @ts-expect-error
    result[key] = typeof value === 'bigint' ? value.toString() : value;
  }

  return result;
}

type DeserializedBigints<T extends Partial<StringRecord>> = {
  [K in keyof T]: Replace<T[K], string, bigint>;
};

function toBigintRecord<T extends Partial<StringRecord>>(input: T): DeserializedBigints<T> {
  const result = {} as DeserializedBigints<T>;
  for (const key in input) {
    const value = input[key];
    // @ts-expect-error
    result[key] = typeof value === 'string' ? BigInt(value) : value;
  }

  return result;
}

export function toSerializableEvmTxParams(params: EvmTxParams): SerializableEvmTxParams {
  switch (params.type) {
    case 'legacy':
    case 'eip2930':
    case 'eip1559':
      return serializeBigints(params);
    // EIP4844 type is left for the case a dApp needs it
    case 'eip4844':
      const serializedBlobs = params.blobs.map(
        (blob): HexString => (typeof blob === 'string' ? blob : `0x${Buffer.from(blob).toString('hex')}`)
      );
      return {
        ...serializeBigints(params),
        blobs: serializedBlobs
      };
    case 'eip7702':
      const serializedAutorizationList = params.authorizationList?.map(auth => serializeBigints(auth));
      return {
        ...serializeBigints(params),
        authorizationList: serializedAutorizationList
      };
    default:
      throw new Error(`Unsupported EVM transaction type: ${params.type}`);
  }
}

export function fromSerializableEvmTxParams(params: SerializableEvmTxParams): EvmTxParams {
  if (params.type === 'legacy' || params.type === 'eip2930') {
    const { gas, value, gasPrice, ...restLegacy } = params;

    return {
      ...restLegacy,
      ...toBigintRecord({ gas, value, gasPrice })
    };
  }

  if (params.type === 'eip1559') {
    const { gas, value, maxFeePerGas, maxPriorityFeePerGas, ...restProps } = params;

    return {
      ...restProps,
      ...toBigintRecord({ gas, value, maxFeePerGas, maxPriorityFeePerGas })
    };
  }

  if (params.type === 'eip4844') {
    const { gas, value, maxFeePerGas, maxPriorityFeePerGas, maxFeePerBlobGas, ...restProps } = params;

    return {
      ...restProps,
      ...toBigintRecord({ gas, value, maxFeePerGas, maxPriorityFeePerGas, maxFeePerBlobGas })
    };
  }

  if (params.type === 'eip7702') {
    const { gas, value, maxFeePerGas, maxPriorityFeePerGas, authorizationList, ...restProps } = params;

    return {
      ...restProps,
      ...toBigintRecord({ gas, value, maxFeePerGas, maxPriorityFeePerGas }),
      authorizationList: authorizationList?.map(({ v, ...restAuthProps }) => ({
        ...restAuthProps,
        ...toBigintRecord({ v })
      }))
    };
  }

  throw new Error(`Unsupported EVM transaction type: ${params.type}`);
}

export function getGasPriceStep(averageGasPrice: bigint) {
  const repeatCount = averageGasPrice.toString().length - 2;

  return BigInt(`1${'0'.repeat(repeatCount > 0 ? repeatCount : 0)}`);
}
