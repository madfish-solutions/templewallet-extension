import { HttpResponseError } from '@taquito/http-utils';
import { TezosOperationError } from '@tezos-x/octez.js';
import { isObject } from 'lodash';
import { BaseError as ViemBaseError } from 'viem';

import { IntercomError } from 'lib/intercom/helpers';

import { getHumanEvmErrorMessage, isSerializedViemError } from './evm';
import { ERROR_MESSAGES } from './messages';
import { getHumanTezosErrorMessage, isSerializedDryRunError } from './tezos';

/**
 * Maps blockchain errors (Tezos and EVM) to user-friendly messages
 * @param error - The error object from blockchain operations
 * @returns A human-readable error message
 */
export function getHumanErrorMessage(error: unknown): string {
  try {
    if (error instanceof ViemBaseError || isSerializedViemError(error)) {
      return getHumanEvmErrorMessage(error);
    }

    if (error instanceof IntercomError && error.errors?.length) {
      return getHumanErrorMessage(isSerializedViemError(error.errors[0]) ? error.errors[0] : { error: error.errors });
    }

    if (error instanceof TezosOperationError || error instanceof HttpResponseError || isSerializedDryRunError(error)) {
      return getHumanTezosErrorMessage(error);
    }
  } catch (e) {
    console.error(e);
    return ERROR_MESSAGES.default;
  }

  if (isObject(error) && 'message' in error && typeof error.message === 'string') {
    const message = error.message.toLowerCase();

    if (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('fetch') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    ) {
      return ERROR_MESSAGES.networkError;
    }

    if (message.includes('nonce')) {
      if (message.includes('too low') || message.includes('already')) {
        return ERROR_MESSAGES.nonceTooLow;
      }
      if (message.includes('too high')) {
        return ERROR_MESSAGES.nonceTooHigh;
      }
      return ERROR_MESSAGES.invalidParams;
    }

    if (message.includes('gas') || (message.includes('tx cost') && message.includes('insufficient funds'))) {
      if (message.includes('too high')) {
        return ERROR_MESSAGES.invalidParams;
      }
      if (message.includes('too low')) {
        return ERROR_MESSAGES.feeTooLow;
      }
      return ERROR_MESSAGES.lowGasBalance;
    }

    if (
      message.includes('balance') ||
      message.includes('insufficient') ||
      message.includes('exceeds balance') ||
      message.includes('insufficient funds')
    ) {
      return ERROR_MESSAGES.balance;
    }

    if (message.includes('fee')) {
      return ERROR_MESSAGES.feeTooLow;
    }

    if (
      message.includes('parameter') ||
      message.includes('invalid') ||
      message.includes('validation') ||
      message.includes('malformed')
    ) {
      return ERROR_MESSAGES.invalidParams;
    }

    if (message.includes('revert') || message.includes('reject') || message.includes('failed')) {
      return ERROR_MESSAGES.executionFailed;
    }
  }

  return ERROR_MESSAGES.default;
}
