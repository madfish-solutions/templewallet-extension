export enum OpStackItemType {
  TransferFrom,
  TransferTo,
  Delegation,
  Interaction,
}

export type OpStackItem =
  | TransferFromItem
  | TransferToItem
  | DelegationItem
  | InteractionItem;

export interface OpStackItemBase {
  type: OpStackItemType;
}

export interface TransferFromItem extends OpStackItemBase {
  type: OpStackItemType.TransferFrom;
  from: string;
}

export interface TransferToItem extends OpStackItemBase {
  type: OpStackItemType.TransferTo;
  to: string;
}

export interface DelegationItem extends OpStackItemBase {
  type: OpStackItemType.Delegation;
  to: string;
}

export interface InteractionItem extends OpStackItemBase {
  type: OpStackItemType.Interaction;
  with: string;
  entrypoint: string;
}
