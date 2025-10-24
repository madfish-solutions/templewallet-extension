import {
  BaseError as ViemBaseError,
  ContractFunctionExecutionError,
  EstimateGasExecutionError,
  HttpRequestError,
  TimeoutError,
  TransactionExecutionError,
  IntrinsicGasTooHighError,
  IntrinsicGasTooLowError,
  NonceTooHighError,
  NonceTooLowError,
  FeeCapTooHighError,
  FeeCapTooLowError,
  TransactionTypeNotSupportedError,
  RpcRequestError,
  decodeErrorResult,
  decodeFunctionData,
  erc20Abi
} from 'viem';

import { erc1155Abi } from 'lib/abi/erc1155';
import { equalsIgnoreCase } from 'lib/evm/on-chain/utils/common.utils';

import { ERROR_MESSAGES } from './messages';

/**
 * Mapping of ERC1155 custom error names (from ABI) to human-readable messages
 */
const ERC1155_ERROR_MESSAGES: Record<string, string> = {
  ERC1155InsufficientBalance: ERROR_MESSAGES.balance,
  ERC1155InvalidSender: ERROR_MESSAGES.invalidParams,
  ERC1155InvalidReceiver: ERROR_MESSAGES.invalidParams,
  ERC1155InvalidApprover: ERROR_MESSAGES.invalidParams,
  ERC1155InvalidOperator: ERROR_MESSAGES.invalidParams,
  ERC1155InvalidArrayLength: ERROR_MESSAGES.invalidParams,
  ERC1155MissingApprovalForAll: ERROR_MESSAGES.notApproved
};

const ERC20_TRANSFER_BALANCE_ERROR_PATTERN = 'ERC20: transfer amount exceeds balance';

/**
 * Common revert reason patterns for legacy string-based errors
 * Used for ERC20, ERC721, and other contracts that use string revert reasons
 */
const REVERT_REASON_PATTERNS: Record<string, string> = {
  'The total cost (gas * gas fee + value) of executing this transaction exceeds the balance of the account':
    ERROR_MESSAGES.lowGasBalance,
  'insufficient funds for gas * price + value': ERROR_MESSAGES.lowGasBalance,
  'insufficient balance for transfer': ERROR_MESSAGES.lowGasBalance,
  'gas required exceeds allowance': ERROR_MESSAGES.lowGasBalance,

  // ERC20 errors
  [ERC20_TRANSFER_BALANCE_ERROR_PATTERN]: ERROR_MESSAGES.balance,
  'ERC20: insufficient allowance': ERROR_MESSAGES.allowanceTooLow,
  'ERC20: transfer from the zero address': ERROR_MESSAGES.invalidParams,
  'ERC20: transfer to the zero address': ERROR_MESSAGES.invalidParams,
  'ERC20: approve from the zero address': ERROR_MESSAGES.invalidParams,
  'ERC20: approve to the zero address': ERROR_MESSAGES.invalidParams,
  'ERC20: burn amount exceeds balance': ERROR_MESSAGES.balance,
  'ERC20: transfer amount exceeds allowance': ERROR_MESSAGES.allowanceTooLow,

  // ERC721 errors
  'ERC721: transfer to the zero address': ERROR_MESSAGES.invalidParams,
  'ERC721: approval to current owner': ERROR_MESSAGES.invalidParams,
  'ERC721: invalid token ID': ERROR_MESSAGES.invalidParams,
  'ERC721: token already minted': ERROR_MESSAGES.invalidParams,
  'ERC721: mint to the zero address': ERROR_MESSAGES.invalidParams,

  // ERC1155 legacy errors
  'ERC1155: insufficient balance': ERROR_MESSAGES.balance,
  'ERC1155: transfer to the zero address': ERROR_MESSAGES.invalidParams,
  'ERC1155: burn amount exceeds balance': ERROR_MESSAGES.balance
};

type SerializedViemError = Pick<
  ViemBaseError,
  'cause' | 'details' | 'shortMessage' | 'message' | 'name' | 'metaMessages'
> & { data?: unknown };

export function isSerializedViemError(error: unknown): error is SerializedViemError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'cause' in error &&
    'details' in error &&
    typeof error.details === 'string' &&
    'shortMessage' in error &&
    typeof error.shortMessage === 'string' &&
    (!('message' in error) || error.message === undefined || typeof error.message === 'string') &&
    'name' in error &&
    typeof error.name === 'string' &&
    'metaMessages' in error &&
    Array.isArray(error.metaMessages)
  );
}

/**
 * Attempts to decode ERC1155 error using ABI
 * Only ERC1155 has custom error definitions in the ABI
 */
function decodeErc1155Error(error: { data?: unknown }): string | null {
  // Check if error has data to decode
  const errorData = error.data;

  if (!errorData || typeof errorData !== 'string' || !errorData.startsWith('0x')) {
    return null;
  }

  try {
    const decoded = decodeErrorResult({
      abi: erc1155Abi,
      data: errorData as `0x${string}`
    });

    if (decoded) {
      // Check if we have a mapped message for this error
      const errorMessage = ERC1155_ERROR_MESSAGES[decoded.errorName];
      if (errorMessage) {
        return errorMessage;
      }

      // If no specific mapping, return a formatted error
      return ERROR_MESSAGES.executionFailed;
    }
  } catch {
    // Error decoding failed, return default error message
  }

  return null;
}

/**
 * Extracts revert reason from EVM error
 */
function extractEvmRevertReason(error: any): string | null {
  if (!error) {
    return null;
  }

  // Try to get the revert reason from viem error
  if (error.details) {
    return error.details;
  }

  // Check for shortMessage
  if (error.shortMessage) {
    return error.shortMessage;
  }

  // Check metaMessages array
  if (Array.isArray(error.metaMessages) && error.metaMessages.length > 0) {
    const revertMsg = error.metaMessages.find(
      (msg: string) => msg.includes('Reverted') || msg.includes('reverted') || msg.includes('Error:')
    );
    if (revertMsg) {
      return revertMsg;
    }
  }

  // Try to extract from error message
  if (error.message) {
    const message = error.message;

    // Look for common revert reason patterns
    const revertMatch = message.match(/reverted with reason string ['"](.+?)['"]/i);
    if (revertMatch) {
      return revertMatch[1];
    }

    const executionRevertMatch = message.match(/execution reverted: (.+?)(?:\n|$)/i);
    if (executionRevertMatch) {
      return executionRevertMatch[1];
    }

    const revertedMatch = message.match(/reverted:\s*(.+?)(?:\n|$)/i);
    if (revertedMatch) {
      return revertedMatch[1];
    }
  }

  return null;
}

function extractEvmTransactionHexValueFromMessage(message: string, paramName: string): HexString | null {
  const regex = new RegExp(`${paramName}:\\s*(0x[a-fA-F0-9]+)(?:\n|$)`);

  const match = message.match(regex);
  if (match) {
    return match[1] as HexString;
  }

  return null;
}

function extractEvmTransactionParams(error: any): Record<'from' | 'to' | 'data', HexString> | null {
  const message = error?.message;

  if (!message) {
    return null;
  }

  const [from, to, data] = [
    extractEvmTransactionHexValueFromMessage(message, 'from'),
    extractEvmTransactionHexValueFromMessage(message, 'to'),
    extractEvmTransactionHexValueFromMessage(message, 'data')
  ];

  return from && to && data ? { from, to, data } : null;
}

const errorHasName = (error: SerializedViemError, name: string) =>
  error.name === name || (error.cause as any)?.name === name;

/**
 * Handles viem-specific errors
 */
export const getHumanEvmErrorMessage = (error: ViemBaseError | SerializedViemError) => {
  // Handle specific viem error types
  if (error instanceof HttpRequestError) {
    return ERROR_MESSAGES.networkError;
  }

  if (error instanceof TimeoutError) {
    return ERROR_MESSAGES.timeout;
  }

  if (error instanceof NonceTooHighError) {
    return ERROR_MESSAGES.nonceTooHigh;
  }

  if (error instanceof NonceTooLowError) {
    return ERROR_MESSAGES.nonceTooLow;
  }

  if (
    error instanceof IntrinsicGasTooHighError ||
    error instanceof FeeCapTooHighError ||
    error instanceof TransactionTypeNotSupportedError
  ) {
    return ERROR_MESSAGES.invalidParams;
  }

  if (error instanceof IntrinsicGasTooLowError || error instanceof FeeCapTooLowError) {
    return ERROR_MESSAGES.feeTooLow;
  }

  // Handle contract execution errors
  if (
    error instanceof ContractFunctionExecutionError ||
    error instanceof TransactionExecutionError ||
    error instanceof EstimateGasExecutionError ||
    error instanceof RpcRequestError ||
    isSerializedViemError(error)
  ) {
    if (errorHasName(error, 'HttpRequestError')) {
      return ERROR_MESSAGES.networkError;
    }

    if (errorHasName(error, 'TimeoutError')) {
      return ERROR_MESSAGES.timeout;
    }

    if (errorHasName(error, 'NonceTooLowError')) {
      return ERROR_MESSAGES.nonceTooLow;
    }

    if (errorHasName(error, 'NonceTooHighError')) {
      return ERROR_MESSAGES.nonceTooHigh;
    }

    // Fallback to extracting revert reason from error message
    const revertReason = extractEvmRevertReason(error);

    if (!revertReason) {
      return ERROR_MESSAGES.executionFailed;
    }

    // Check against known revert reason patterns
    for (const [pattern, message] of Object.entries(REVERT_REASON_PATTERNS)) {
      if (!revertReason.includes(pattern)) {
        continue;
      }

      if (pattern === ERC20_TRANSFER_BALANCE_ERROR_PATTERN) {
        const transactionParams = extractEvmTransactionParams(error);

        if (!transactionParams) {
          return message;
        }

        const { from, data } = transactionParams;

        try {
          const decoded = decodeFunctionData({ abi: erc20Abi, data });

          return decoded.functionName === 'transfer' ||
            (decoded.functionName === 'transferFrom' && equalsIgnoreCase(decoded.args[0], from))
            ? message
            : ERROR_MESSAGES.executionFailed;
        } catch {
          return ERROR_MESSAGES.executionFailed;
        }
      }

      return message;
    }

    if (error instanceof RpcRequestError || isSerializedViemError(error)) {
      const erc1155DecodedMessage = decodeErc1155Error(error);

      if (erc1155DecodedMessage) {
        return erc1155DecodedMessage;
      }
    }

    return ERROR_MESSAGES.executionFailed;
  }

  // Check error name for other viem errors
  const errorName = (error as ViemBaseError).name?.toLowerCase() || '';

  if (errorName.includes('fee') || errorName.includes('gasprice')) {
    return ERROR_MESSAGES.feeTooLow;
  }

  if (errorName.includes('gas')) {
    return ERROR_MESSAGES.lowGasBalance;
  }

  if (errorName.includes('nonce')) {
    return ERROR_MESSAGES.nonceTooLow;
  }

  if (errorName.includes('balance') || errorName.includes('funds')) {
    return ERROR_MESSAGES.balance;
  }

  return ERROR_MESSAGES.default;
};
