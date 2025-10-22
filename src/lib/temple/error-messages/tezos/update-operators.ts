import { ERROR_MESSAGES } from '../messages';

import { ContractInteractionParseFailedTransactionResult } from './utils';

export const getUpdateOperatorsErrorMessage = ({
  failedOperation,
  errorMnemonic,
  initiatorPkh
}: ContractInteractionParseFailedTransactionResult) =>
  errorMnemonic === 'FA2_TOKEN_UNDEFINED' && failedOperation.source === initiatorPkh
    ? ERROR_MESSAGES.invalidParams
    : ERROR_MESSAGES.executionFailed;
