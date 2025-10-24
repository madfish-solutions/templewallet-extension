import { kebabCase } from 'lodash';

import { ERROR_MESSAGES } from '../messages';

import { ContractInteractionParseFailedTransactionResult, KUSD_CONTRACT_ADDRESS } from './utils';

export const getApproveErrorMessage = ({
  failedOperation,
  errorCode,
  errorMnemonic,
  initiatorPkh
}: ContractInteractionParseFailedTransactionResult) => {
  const isDirectApprove = failedOperation.source === initiatorPkh;

  if (errorCode === '23' && failedOperation.destination === KUSD_CONTRACT_ADDRESS) {
    return isDirectApprove ? ERROR_MESSAGES.unsafeAllowanceChange : ERROR_MESSAGES.executionFailed;
  }

  if (!errorMnemonic) {
    return ERROR_MESSAGES.executionFailed;
  }

  const kebabCaseErrorMnemonic = kebabCase(errorMnemonic);

  return kebabCaseErrorMnemonic.includes('unsafe-allowance-change') && isDirectApprove
    ? ERROR_MESSAGES.unsafeAllowanceChange
    : ERROR_MESSAGES.executionFailed;
};
