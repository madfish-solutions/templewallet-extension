import { HttpResponseError } from '@taquito/http-utils';
import { TezosOperationError } from '@tezos-x/octez.js';
import { MichelsonV1Expression, TezosGenericOperationError } from '@tezos-x/octez.js-rpc';
import { isObject } from 'lodash';

import { isTezosContractAddress } from 'lib/tezos';

import { ERROR_MESSAGES } from '../messages';

import { getApproveErrorMessage } from './approve';
import { getTransferErrorMessage } from './transfer';
import { getUpdateOperatorsErrorMessage } from './update-operators';
import { isContractInteractionParseFailedTransactionResult, parseFailedTransaction } from './utils';

type ErrorMessageKey = keyof typeof ERROR_MESSAGES;

/**
 * Tezos error patterns mapped to message keys
 */
const TEZOS_ERROR_PATTERNS: Partial<Record<ErrorMessageKey, string[]>> = {
  blockchainLoad: ['gas_exhausted.block'],
  lowGasBalance: [
    'cannot_pay_storage_fee',
    'empty_implicit_contract',
    'balance_too_low',
    'empty_implicit_delegated_contract',
    'empty_delegate_account'
  ],
  feeTooLow: ['fees_too_low', 'cannot_serialize_storage', 'cannot_serialize_failure'],
  gasLimitTooLow: ['gas_exhausted.operation'],
  storageLimitTooLow: ['storage_exhausted.operation'],
  notThisCycle: ['stake_info_already_set'],
  invalidParams: [
    'invalid',
    'incorrect',
    'missing',
    'cannot_parse',
    'illformedViewType',
    'gas_limit_too_high',
    'unknown_primitive_name',
    'entrypoint_name_too_long',
    'unexpected_default_entrypoint',
    'contents_list_error',
    'negative_storage_input',
    'storage_limit_too_high',
    'non_printable_character',
    'unexpected_page_size',
    'empty_proposals',
    'proposals_contain_duplicate',
    'already_proposed',
    'invalid_nonzero_transaction_amount',
    'block.multiple_revelation',
    'bad_contract_parameter'
  ],
  fullySlashedDelegate: ['cannot_stake_on_fully_slashed_delegate'],
  unregisteredDelegate: ['manager.unregistered_delegate'],
  delegateAlreadyActive: ['delegate.already_active'],
  delegateUnchanged: ['delegate.unchanged'],
  tmpForbiddenDelegate: ['temporarily_forbidden_delegate'],
  executionFailed: [
    'script_rejected',
    'runtime_error',
    'script_failed',
    'viewerUnexpectedStorage',
    'viewUnexpectedReturn',
    'viewNeverReturns',
    'tez.addition_overflow',
    'tez.subtraction_underflow',
    'tez.multiplication_overflow',
    'timestamp_add',
    'too_many_internal_operations',
    'tez.negative_multiplicator',
    'period_overflow',
    'malformed_period',
    'timestamp_sub',
    'non_existing_contract',
    'failure'
  ],
  nonceTooHigh: ['counter_in_the_future'],
  nonceTooLow: ['counter_in_the_past']
};

const PARAMETER_VALIDATION_ERROR_NAMES = [
  'InvalidAddressError',
  'InvalidStakingAddressError',
  'InvalidFinalizeUnstakeAmountError',
  'InvalidAmountError',
  'InvalidContractAddressError',
  'InvalidOperationKindError'
] as const;

// TODO: Add extra fields when necessary
type TezosGenericOperationErrorWithExtraFields = TezosGenericOperationError & {
  contract?: string;
  with?: MichelsonV1Expression;
  contract_handle?: string;
};
type SerializedHttpResponseError = Pick<
  HttpResponseError,
  'body' | 'name' | 'message' | 'status' | 'url' | 'statusText'
>;
type SerializedTezosOperationError = Pick<
  TezosOperationError,
  'errors' | 'operationsWithResults' | 'errorDetails' | 'name' | 'message'
>;

interface SerializedParameterValidationError {
  name: (typeof PARAMETER_VALIDATION_ERROR_NAMES)[number];
}

interface SerializedDryRunError {
  error: (SerializedTezosOperationError | SerializedHttpResponseError | SerializedParameterValidationError)[];
}

function isSerializedHttpResponseError(error: unknown): error is SerializedHttpResponseError {
  return isObject(error) && 'name' in error && error.name === 'HttpResponseError';
}

function isSerializedTezosOperationError(error: unknown): error is SerializedTezosOperationError {
  return isObject(error) && 'name' in error && error.name === 'TezosOperationError';
}

function isSerializedParameterValidationError(error: unknown): error is SerializedParameterValidationError {
  return (
    isObject(error) &&
    'name' in error &&
    PARAMETER_VALIDATION_ERROR_NAMES.includes(error.name as SerializedParameterValidationError['name'])
  );
}

export function isSerializedDryRunError(error: unknown): error is SerializedDryRunError {
  return (
    isObject(error) &&
    'error' in error &&
    Array.isArray(error.error) &&
    error.error.every(
      err =>
        isSerializedHttpResponseError(err) ||
        isSerializedTezosOperationError(err) ||
        isSerializedParameterValidationError(err)
    )
  );
}

/**
 * Checks if any error in the errors array matches the given patterns
 */
function hasErrorPattern(error: SerializedTezosOperationError, patterns: readonly string[]): boolean {
  return error.errors.some(err => patterns.some(pattern => err.id.includes(pattern)));
}

function tryMakeTezosOperationError(error: SerializedHttpResponseError) {
  try {
    const body = JSON.parse(error.body);
    if (
      Array.isArray(body) &&
      body.length > 0 &&
      body.every(item => isObject(item) && 'kind' in item && 'id' in item)
    ) {
      return new TezosOperationError(body, '', []);
    }
  } catch {
    // ignore parse errors
  }

  return undefined;
}

export const getHumanTezosErrorMessage = (
  error: TezosOperationError | HttpResponseError | SerializedDryRunError
): string => {
  if (error instanceof TezosOperationError) {
    const balanceTooLowError: TezosGenericOperationErrorWithExtraFields | undefined = error.errors.find(err =>
      err.id.includes('balance_too_low')
    );

    if (balanceTooLowError) {
      const { contract } = balanceTooLowError;

      return !contract || !isTezosContractAddress(contract)
        ? ERROR_MESSAGES.lowGasBalance
        : ERROR_MESSAGES.executionFailed;
    }

    const scriptRejectedError: TezosGenericOperationErrorWithExtraFields | undefined = error.errors.find(err =>
      err.id.includes('script_rejected')
    );

    if (!scriptRejectedError) {
      for (const [key, patterns] of Object.entries(TEZOS_ERROR_PATTERNS)) {
        if (hasErrorPattern(error, patterns) && key in ERROR_MESSAGES) {
          return ERROR_MESSAGES[key as ErrorMessageKey];
        }
      }

      return ERROR_MESSAGES.default;
    }

    const parseResult = parseFailedTransaction(error.operationsWithResults, scriptRejectedError.with);

    if (!isContractInteractionParseFailedTransactionResult(parseResult)) {
      return ERROR_MESSAGES.executionFailed;
    }

    switch (parseResult.failedOperation.parameters.entrypoint) {
      case 'transfer':
        return getTransferErrorMessage(parseResult);
      case 'approve':
        return getApproveErrorMessage(parseResult);
      case 'update_operators':
        return getUpdateOperatorsErrorMessage(parseResult);
    }

    return ERROR_MESSAGES.executionFailed;
  }

  if (isSerializedDryRunError(error)) {
    const serializedResponseError = error.error.find(isSerializedHttpResponseError);
    if (serializedResponseError) {
      const { body, statusText, message, status, url } = serializedResponseError;

      return getHumanTezosErrorMessage(new HttpResponseError(message, status, statusText, body, url));
    }

    const serializedTezosOperationError = error.error.find(isSerializedTezosOperationError);
    if (serializedTezosOperationError) {
      const { errors, operationsWithResults, errorDetails } = serializedTezosOperationError;

      return getHumanTezosErrorMessage(new TezosOperationError(errors, errorDetails, operationsWithResults));
    }

    const serializedParameterValidationError = error.error.find(isSerializedParameterValidationError);
    if (serializedParameterValidationError) {
      return ERROR_MESSAGES.invalidParams;
    }

    return ERROR_MESSAGES.default;
  }

  const tezosOperationError = tryMakeTezosOperationError(error);

  if (tezosOperationError) {
    return getHumanTezosErrorMessage(tezosOperationError);
  }

  const status = Number(error.status);
  if (status === 0 || status >= 500) {
    return ERROR_MESSAGES.networkError;
  }

  if (status >= 400 && status < 500) {
    return ERROR_MESSAGES.invalidParams;
  }

  return ERROR_MESSAGES.default;
};
