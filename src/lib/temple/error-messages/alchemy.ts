import { decodeErrorResult, isHex, parseAbi } from 'viem';

import { AlchemyRpcError } from 'lib/apis/temple/endpoints/evm/alchemy-wallet';
import { t } from 'lib/i18n';

import { ERROR_MESSAGES } from './messages';

const standardRevertAbi = parseAbi(['error Error(string)', 'error Panic(uint256)']);

export function getHumanAlchemyErrorMessage(error: AlchemyRpcError): string {
  const data = error.data;
  const details = data && typeof data === 'object' ? data : null;
  const reason = details && 'reason' in details && typeof details.reason === 'string' ? details.reason : '';
  const innerReason =
    details && 'innerReason' in details && typeof details.innerReason === 'string' ? details.innerReason : '';
  const revertData = details && 'revertData' in details ? details.revertData : undefined;
  let decodedReason = '';

  if (typeof revertData === 'string' && isHex(revertData)) {
    try {
      const decoded = decodeErrorResult({ abi: standardRevertAbi, data: revertData });
      if (decoded.errorName === 'Error') decodedReason = String(decoded.args[0]);
    } catch {
      // Custom contract errors need the contract ABI.
    }
  }

  const message = [error.message, reason, innerReason, decodedReason].join(' ').toLowerCase();

  if (/aa21|sender balance|prefund|insufficient funds|insufficient balance for gas/.test(message)) {
    return ERROR_MESSAGES.lowGasBalance;
  }
  if (/transfer amount exceeds balance|transfer amount exceeds|erc20.*balance/.test(message)) {
    return ERROR_MESSAGES.balance;
  }
  if (/insufficient allowance|transfer amount exceeds allowance/.test(message)) {
    return ERROR_MESSAGES.allowanceTooLow;
  }
  if (
    /replacement underpriced|maxfee?pergas.*(?:too low|must be at least)|maxpriorityfeepergas.*(?:too low|must be at least)/.test(
      message
    )
  ) {
    return ERROR_MESSAGES.feeTooLow;
  }
  if (/nonce mismatch|aa25|invalid account nonce/.test(message)) {
    return t('alchemyNonceChangedError');
  }
  if (/out of time range|expired/.test(message) || error.code === -32503) {
    return t('alchemyQuoteExpiredError');
  }
  if (/too many pending transactions/.test(message)) {
    return t('alchemyPendingOperationError');
  }
  if (/authorization signature is invalid|invalid account signature/.test(message)) {
    return t('alchemySignatureError');
  }
  if (/requires sponsored operations/.test(message)) {
    return t('alchemySponsorshipRequiredError');
  }
  if (/sponsorship failed|paymaster/.test(message) && error.code !== -32521) {
    return t('alchemySponsorshipError');
  }
  if (/eip-7702 is not enabled|unsupported chain/.test(message)) {
    return t('alchemyUnsupportedNetworkError');
  }
  if (/preverificationgas|callgaslimit|verificationgaslimit|total gas limit/.test(message)) {
    return t('alchemyGasEstimateError');
  }

  switch (error.code) {
    case -32500:
    case -32521:
      return ERROR_MESSAGES.executionFailed;
    case -32501:
    case -32508:
      return t('alchemySponsorshipError');
    case -32502:
    case -32506:
    case -32600:
    case -32602:
      return ERROR_MESSAGES.invalidParams;
    case -32504:
    case -32505:
    case -32603:
    case 429:
      return t('alchemyTemporaryError');
    case -32507:
      return t('alchemySignatureError');
    case -32000:
      return ERROR_MESSAGES.executionFailed;
    default:
      return ERROR_MESSAGES.default;
  }
}
