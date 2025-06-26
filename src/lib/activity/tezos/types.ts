import type { TzktOperation, TzktOperationType } from 'lib/apis/tzkt';

import type { OperationMember } from '../types';

export interface TempleTzktOperationsGroup {
  hash: string;
  operations: TzktOperation[];
}

export type TezosPreActivityStatus = TzktOperation['status'] | 'pending';

export interface TezosActivityOlderThan {
  hash: string;
  oldestTzktOperation: Pick<TzktOperation, 'timestamp' | 'level'>;
}

export interface TezosPreActivity extends TezosActivityOlderThan {
  oldestTzktOperation: TzktOperation;
  /** ISO string */
  addedAt: string;
  status: TezosPreActivityStatus;
  /** Sorted old-to-new */
  operations: TezosPreActivityOperation[];
  chainId: string;
}

type PickedPropsFromTzktOperation = Pick<TzktOperation, 'id' | 'level'>;

export interface TezosPreActivityOperationBase extends PickedPropsFromTzktOperation {
  sender: OperationMember;
  contract?: string;
  tokenId?: string;
  status: TezosPreActivityStatus;
  amountSigned: string;
  addedAt: string;
}

export interface TezosPreActivityTransactionOperation extends TezosPreActivityOperationBase {
  type: 'transaction';
  subtype?: 'transfer' | 'approve';
  from: OperationMember;
  /** Optional - parser is not keeping all of `txs`'s `to_`s, reducing to total amount */
  to: OperationMember[];
  destination: OperationMember;
  entrypoint?: string;
}

export interface TezosPreActivityOtherOperation extends TezosPreActivityOperationBase {
  type: Exclude<TzktOperationType, 'transaction'>;
  destination?: OperationMember;
}

export type TezosPreActivityOperation = TezosPreActivityTransactionOperation | TezosPreActivityOtherOperation;
