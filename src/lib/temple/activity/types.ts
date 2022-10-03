export enum OpStackItemType {
  TransferTo,
  TransferFrom,
  Delegation,
  Interaction,
  Origination,
  Other
}

export type OpStackItem =
  | TransferFromItem
  | TransferToItem
  | DelegationItem
  | InteractionItem
  | OriginationItem
  | OtherItem;

interface OpStackItemBase {
  type: OpStackItemType;
}

interface TransferFromItem extends OpStackItemBase {
  type: OpStackItemType.TransferFrom;
  from: string;
}

interface TransferToItem extends OpStackItemBase {
  type: OpStackItemType.TransferTo;
  to: string;
}

interface DelegationItem extends OpStackItemBase {
  type: OpStackItemType.Delegation;
  to: string;
}

interface InteractionItem extends OpStackItemBase {
  type: OpStackItemType.Interaction;
  with: string;
  entrypoint: string;
}

interface OriginationItem extends OpStackItemBase {
  type: OpStackItemType.Origination;
  contract?: string;
}

interface OtherItem extends OpStackItemBase {
  type: OpStackItemType.Other;
  name: string;
}
