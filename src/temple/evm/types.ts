import { evmRpcMethodsNames } from './constants';

export class ErrorWithCode extends Error {
  constructor(public code: number, message: string, public data?: Record<string, unknown>) {
    super(message);
  }
}

export interface ChangePermissionsPayload {
  [evmRpcMethodsNames.eth_accounts]: StringRecord<unknown>;
}
