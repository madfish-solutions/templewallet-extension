import { TzktOperation, TzktAlias, TzktOperationType } from 'lib/apis/tzkt';

export interface OperationsGroup {
  hash: string;
  operations: TzktOperation[];
}

export type TezosPreActivityStatus = TzktOperation['status'] | 'pending';

export type OperationMember = TzktAlias;

export interface TezosPreActivity {
  hash: string;
  /** ISO string */
  addedAt: string;
  status: TezosPreActivityStatus;
  oldestTzktOperation: TzktOperation;
  /** Sorted new-to-old */
  operations: TezosPreActivityOperation[];
}

type PickedPropsFromTzktOperation = Pick<TzktOperation, 'id' | 'level'>;

export interface TezosPreActivityOperationBase extends PickedPropsFromTzktOperation {
  contractAddress?: string;
  status: TezosPreActivityStatus;
  amountSigned: string;
  addedAt: string;
}

export interface TezosPreActivityTransactionOperation extends TezosPreActivityOperationBase {
  type: 'transaction';
  from: OperationMember;
  to?: OperationMember;
  destination: OperationMember;
  entrypoint?: string;
  tokenId?: string;
}

export interface TezosPreActivityOtherOperation extends TezosPreActivityOperationBase {
  type: Exclude<TzktOperationType, 'transaction'>;
  source: OperationMember;
  destination?: OperationMember;
}

export type TezosPreActivityOperation = TezosPreActivityTransactionOperation | TezosPreActivityOtherOperation;
