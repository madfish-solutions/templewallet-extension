import { kebabCase } from 'lodash';

import { fa12TransferParamsSchema, fa2TransferParamsSchema } from 'lib/tezos/schemas';

import { ERROR_MESSAGES } from '../messages';

import { ContractInteractionParseFailedTransactionResult, KUSD_CONTRACT_ADDRESS } from './utils';

export const getTransferErrorMessage = ({
  failedOperation,
  errorCode,
  errorMnemonic,
  initiatorPkh
}: ContractInteractionParseFailedTransactionResult) => {
  let fa12SenderPkh: string | undefined;
  try {
    const { from } = fa12TransferParamsSchema.Execute(failedOperation.parameters.value);
    fa12SenderPkh = from;
  } catch {
    // do nothing
  }

  const isTransferFromInitiator = fa12SenderPkh === initiatorPkh || !initiatorPkh;
  const isDirectCall = failedOperation.source === initiatorPkh;

  if (errorCode === '23' && failedOperation.destination === KUSD_CONTRACT_ADDRESS) {
    return isTransferFromInitiator ? ERROR_MESSAGES.balance : ERROR_MESSAGES.executionFailed;
  }

  if (errorCode === '22' && failedOperation.destination === KUSD_CONTRACT_ADDRESS) {
    return isTransferFromInitiator ? ERROR_MESSAGES.allowanceTooLow : ERROR_MESSAGES.executionFailed;
  }

  switch (errorMnemonic) {
    case undefined:
      return ERROR_MESSAGES.executionFailed;
    case 'FA2_TOKEN_UNDEFINED':
      return isDirectCall ? ERROR_MESSAGES.invalidParams : ERROR_MESSAGES.executionFailed;
    case 'FA2_INSUFFICIENT_BALANCE':
      try {
        const fa2TransferParams: any[] = fa2TransferParamsSchema.Execute(failedOperation.parameters.value);
        const allTransfersAreDirect = fa2TransferParams.every(({ from_ }) => from_ === initiatorPkh);

        return allTransfersAreDirect ? ERROR_MESSAGES.balance : ERROR_MESSAGES.executionFailed;
      } catch {
        return ERROR_MESSAGES.executionFailed;
      }
    case 'FA2_NOT_OPERATOR':
      return ERROR_MESSAGES.notApproved;
    default:
      const kebabCaseErrorMnemonic = kebabCase(errorMnemonic);

      if (
        kebabCaseErrorMnemonic.includes('not-enough-balance') ||
        kebabCaseErrorMnemonic.includes('insufficient-balance')
      ) {
        return isTransferFromInitiator ? ERROR_MESSAGES.balance : ERROR_MESSAGES.executionFailed;
      }

      if (kebabCaseErrorMnemonic.includes('not-enough-allowance') || kebabCaseErrorMnemonic.includes('not-allowed')) {
        return isTransferFromInitiator ? ERROR_MESSAGES.allowanceTooLow : ERROR_MESSAGES.executionFailed;
      }

      return ERROR_MESSAGES.executionFailed;
  }
};
