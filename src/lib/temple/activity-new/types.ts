import type { TzktOperation, TzktAlias, TzktOperationType } from 'lib/tzkt/types';

export interface OperGroup {
  hash: string;
  operations: TzktOperation[];
}

export type ActivityStatus = TzktOperation['status'] | 'pending';

export type ActivityMember = TzktAlias;
export interface Activity {
  hash: string;
  addedAt: string; // : ISO string
  status: ActivityStatus;
  oldestTzktOperation: TzktOperation;
  /**
   * Sorted new-to-old
   */
  operations: ActivityOperation[];
}

type PickedPropsFromOperation = Pick<TzktOperation, 'hash' | 'id' | 'level'>;

export interface ActivityOperationBase extends PickedPropsFromOperation {
  contractAddress?: string;
  source: ActivityMember;
  status: ActivityStatus;
  amountSigned: string;
  addedAt: string;
  timestamp: number;
}

export interface ActivityTransactionOperation extends ActivityOperationBase {
  type: 'transaction';
  destination: ActivityMember;
  entrypoint?: string;
  tokenId?: string;
}

export interface ActivityOtherOperation extends ActivityOperationBase {
  type: Exclude<TzktOperationType, 'transaction'>;
  destination?: ActivityMember;
}

export type ActivityOperation = ActivityTransactionOperation | ActivityOtherOperation;

//// OPER-STACK

export enum OperStackItemType {
  TransferTo,
  TransferFrom,
  Delegation,
  Interaction,
  Origination,
  Other
}

export type OperStackItem =
  | TransferFromItem
  | TransferToItem
  | DelegationItem
  | InteractionItem
  | OriginationItem
  | OtherItem;

export interface OperStackItemBase {
  type: OperStackItemType;
}

export interface TransferFromItem extends OperStackItemBase {
  type: OperStackItemType.TransferFrom;
  from: string;
}

export interface TransferToItem extends OperStackItemBase {
  type: OperStackItemType.TransferTo;
  to: string;
}

export interface DelegationItem extends OperStackItemBase {
  type: OperStackItemType.Delegation;
  to: string;
}

export interface InteractionItem extends OperStackItemBase {
  type: OperStackItemType.Interaction;
  with: string;
  entrypoint?: string;
}

export interface OriginationItem extends OperStackItemBase {
  type: OperStackItemType.Origination;
  contract?: string;
}

export interface OtherItem extends OperStackItemBase {
  type: OperStackItemType.Other;
  name: TzktOperationType;
}
