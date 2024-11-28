import { evmRpcMethodsNames } from './constants';

export interface EvmTxParams {
  to: HexString;
  value: bigint;
  gas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  nonce?: number;
}

export interface SerializableEvmTxParams extends Pick<EvmTxParams, 'to' | 'nonce'> {
  value: string;
  gas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export class ErrorWithCode extends Error {
  constructor(public code: number, message: string) {
    super(message);
  }
}

export interface ChangePermissionsPayload {
  [evmRpcMethodsNames.eth_accounts]: StringRecord<unknown>;
}
