import { BcdTokenTransfer } from "lib/better-call-dev";
import {
  TzktOperation,
  TzktRevealOperation,
  TzktTransactionOperation,
  TzktDelegationOperation,
} from "lib/tzkt";

interface ThanosOperationBase {
  hash: string;
  type: string;
  sender: string;
  status: string;
  time: string;
  isThanosPending: boolean;
}

export interface ThanosPendingOperation extends ThanosOperationBase {
  amount: number;
  status: "backtracked";
  isThanosPending: true;
}

interface ThanosHistoricalOperationBase extends ThanosOperationBase {
  isThanosPending: false;
}

export interface ThanosHistoricalTokenTransaction
  extends ThanosHistoricalOperationBase,
    Pick<BcdTokenTransfer, "contract" | "amount"> {
  type: "transaction";
  receiver: string;
}

interface ThanosHistoricalTzktOperationBase
  extends ThanosHistoricalOperationBase,
    Pick<TzktOperation, "bakerFee" | "errors" | "gasLimit" | "gasUsed"> {
  type: TzktOperation["type"];
}

export interface ThanosHistoricalReveal
  extends ThanosHistoricalTzktOperationBase {
  type: TzktRevealOperation["type"];
}

export interface ThanosHistoricalTzktTransaction
  extends ThanosHistoricalTzktOperationBase,
    Pick<
      TzktTransactionOperation,
      | "parameters"
      | "amount"
      | "initiator"
      | "storageLimit"
      | "storageUsed"
      | "storageFee"
      | "allocationFee"
    > {
  type: TzktTransactionOperation["type"];
  receiver: string;
}

export interface ThanosHistoricalDelegation
  extends ThanosHistoricalTzktOperationBase,
    Pick<
      TzktDelegationOperation,
      "initiator" | "amount" | "prevDelegate" | "newDelegate"
    > {
  type: TzktDelegationOperation["type"];
}

export type ThanosHistoricalTzktOperation =
  | ThanosHistoricalReveal
  | ThanosHistoricalTzktTransaction
  | ThanosHistoricalDelegation;
export type ThanosHistoricalOperation =
  | ThanosHistoricalTokenTransaction
  | ThanosHistoricalTzktOperation;
export type ThanosOperation =
  | ThanosHistoricalOperation
  | ThanosPendingOperation;

type ThanosOperationWithReceiver =
  | ThanosHistoricalTokenTransaction
  | ThanosHistoricalTzktTransaction;
type ThanosOperationWithAmount =
  | ThanosPendingOperation
  | ThanosHistoricalTokenTransaction
  | ThanosHistoricalTzktTransaction
  | ThanosHistoricalDelegation;

export function isThanosPendingOperation(
  operation: ThanosOperation
): operation is ThanosPendingOperation {
  return operation.isThanosPending;
}

export function isTokenTransaction(
  operation: ThanosOperation
): operation is ThanosHistoricalTokenTransaction {
  return (
    !isThanosPendingOperation(operation) &&
    operation.type === "transaction" &&
    !!(operation as ThanosHistoricalTokenTransaction).contract
  );
}

export function isRevealOperation(
  operation: ThanosOperation
): operation is ThanosHistoricalReveal {
  return !isThanosPendingOperation(operation) && operation.type === "reveal";
}

export function isDelegationOperation(
  operation: ThanosOperation
): operation is ThanosHistoricalDelegation {
  return (
    !isThanosPendingOperation(operation) && operation.type === "delegation"
  );
}

export function isTzktTransaction(
  operation: ThanosOperation
): operation is ThanosHistoricalTzktTransaction {
  return (
    operation.type === "transaction" &&
    !isThanosPendingOperation(operation) &&
    !isTokenTransaction(operation)
  );
}

export function hasReceiver(
  operation: ThanosOperation
): operation is ThanosOperationWithReceiver {
  return isTokenTransaction(operation) || isTzktTransaction(operation);
}

export function hasAmount(
  operation: ThanosOperation
): operation is ThanosOperationWithAmount {
  return (
    isThanosPendingOperation(operation) ||
    isTokenTransaction(operation) ||
    isTzktTransaction(operation) ||
    isDelegationOperation(operation)
  );
}
