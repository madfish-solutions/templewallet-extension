import {
  InternalOperationResult,
  MichelsonV1Expression,
  OpKind,
  OperationContentsAndResult,
  OperationContentsAndResultTransaction,
  TransactionOperationParameter
} from '@tezos-x/octez.js-rpc';

interface ParseFailedTransactionResult {
  failedOperation?: OperationContentsAndResultTransaction | InternalOperationResult;
  errorMnemonic?: string;
  errorCode?: string;
  initiatorPkh?: string;
}

export interface ContractInteractionParseFailedTransactionResult extends ParseFailedTransactionResult {
  failedOperation: (OperationContentsAndResultTransaction | InternalOperationResult) & {
    parameters: TransactionOperationParameter;
  };
}

export const KUSD_CONTRACT_ADDRESS = 'KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV';

export const isContractInteractionParseFailedTransactionResult = (
  result: ParseFailedTransactionResult
): result is ContractInteractionParseFailedTransactionResult =>
  result.failedOperation?.kind === OpKind.TRANSACTION && result.failedOperation?.parameters?.entrypoint !== undefined;

export const parseFailedTransaction = (
  operationsWithResults: OperationContentsAndResult[],
  errorDetails?: MichelsonV1Expression
): ParseFailedTransactionResult => {
  const failedOperation =
    operationsWithResults.find(
      (result): result is OperationContentsAndResultTransaction =>
        result.kind === OpKind.TRANSACTION && result.metadata.operation_result.status === 'failed'
    ) ??
    operationsWithResults
      .map(result =>
        result.kind === OpKind.TRANSACTION
          ? result.metadata.internal_operation_results?.find(
              internalResult => internalResult.kind === OpKind.TRANSACTION && internalResult.result.status === 'failed'
            )
          : undefined
      )
      .find(v => v !== undefined);

  let errorMnemonic: string | undefined;
  let errorCode: string | undefined;
  if (errorDetails && 'string' in errorDetails) {
    errorMnemonic = errorDetails.string;
  } else if (errorDetails && 'int' in errorDetails) {
    errorCode = errorDetails.int;
  } else if (
    errorDetails &&
    'prim' in errorDetails &&
    errorDetails.prim.toLowerCase() === 'pair' &&
    errorDetails.args?.[0] &&
    'string' in errorDetails.args[0]
  ) {
    errorMnemonic = errorDetails.args[0].string;
  }
  const initiatorPkh = operationsWithResults
    .map(res => ('source' in res ? res.source : undefined))
    .find(v => typeof v === 'string');

  return { failedOperation, errorMnemonic, errorCode, initiatorPkh };
};
