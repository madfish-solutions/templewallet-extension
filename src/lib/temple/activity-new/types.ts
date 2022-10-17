import { TzktOperation, TzktAlias, TzktOperationType } from 'lib/tzkt';

export interface OperationsGroup {
  hash: string;
  operations: TzktOperation[];
}

export type ActivityStatus = TzktOperation['status'] | 'pending';

export type ActivityMember = TzktAlias;
export interface Activity {
  hash: string;
  /** ISO string */
  addedAt: string;
  status: ActivityStatus;
  oldestTzktOperation: TzktOperation;
  /** Sorted new-to-old */
  operations: ActivityOperation[];
}

type PickedPropsFromTzktOperation = Pick<TzktOperation, 'id' | 'level'>;

export interface ActivityOperationBase extends PickedPropsFromTzktOperation {
  contractAddress?: string;
  source: ActivityMember;
  status: ActivityStatus;
  amountSigned: string;
  addedAt: string;
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

export enum OperStackItemTypeEnum {
  TransferTo,
  TransferFrom,
  Delegation,
  Interaction,
  Origination,
  Other
}

export type OperStackItemInterface =
  | TransferFromItem
  | TransferToItem
  | DelegationItem
  | InteractionItem
  | OriginationItem
  | OtherItem;

interface OperStackItemBase {
  type: OperStackItemTypeEnum;
}

interface TransferFromItem extends OperStackItemBase {
  type: OperStackItemTypeEnum.TransferFrom;
  from: string;
}

interface TransferToItem extends OperStackItemBase {
  type: OperStackItemTypeEnum.TransferTo;
  to: string;
}

interface DelegationItem extends OperStackItemBase {
  type: OperStackItemTypeEnum.Delegation;
  to: string;
}

interface InteractionItem extends OperStackItemBase {
  type: OperStackItemTypeEnum.Interaction;
  with: string;
  entrypoint?: string;
}

interface OriginationItem extends OperStackItemBase {
  type: OperStackItemTypeEnum.Origination;
  contract?: string;
}

interface OtherItem extends OperStackItemBase {
  type: OperStackItemTypeEnum.Other;
  name: TzktOperationType;
}
