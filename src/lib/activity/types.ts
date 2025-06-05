import { TzktOperation } from 'lib/apis/tzkt';
import { TempleChainKind } from 'temple/types';

import { TezosActivityOlderThan } from './tezos/types';

export enum ActivityOperKindEnum {
  interaction,
  transfer,
  approve
}

export type Activity = TezosActivity | EvmActivity;

interface ChainActivityBase {
  chain: TempleChainKind;
  hash: string;
  /** Original, not filtered number of operations */
  operationsCount: number;
  /** ISO string */
  addedAt: string;
  status?: ActivityStatus;
}

export enum ActivityStatus {
  applied,
  pending,
  failed
}

interface OperationBase {
  kind: ActivityOperKindEnum;
}

export interface TezosActivity extends ChainActivityBase, TezosActivityOlderThan {
  oldestTzktOperation: Pick<TzktOperation, 'timestamp' | 'level' | 'id' | 'hash'>;
  chain: TempleChainKind.Tezos;
  chainId: string;
  operations: TezosOperation[];
}

interface TezosOperationBase extends OperationBase {
  assetSlug?: string;
  /** `null` for 'unlimited' amount */
  amountSigned?: string | null;
}

interface TezosApproveOperation extends TezosOperationBase {
  kind: ActivityOperKindEnum.approve;
  spenderAddress: string;
}

export enum ActivityOperTransferType {
  send,
  receive,
  sendToAccount,
  receiveFromAccount
}

interface TezosTransferOperation extends TezosOperationBase {
  kind: ActivityOperKindEnum.transfer;
  type: ActivityOperTransferType;
  fromAddress: string;
  toAddress: string;
}

interface TezosInteractionOperation extends TezosOperationBase {
  kind: ActivityOperKindEnum.interaction;
  withAddress?: string;
}

export type TezosOperation = TezosApproveOperation | TezosTransferOperation | TezosInteractionOperation;

export interface EvmActivity extends ChainActivityBase {
  chain: TempleChainKind.EVM;
  chainId: number;
  operations: EvmOperation[];
  blockHeight: `${number}`;
  index: number | null;
  fee: string | null;
  value: string | null;
}

interface EvmOperationBase extends OperationBase {
  asset?: EvmActivityAsset;
  logIndex: number;
}

interface EvmApproveOperation extends EvmOperationBase {
  kind: ActivityOperKindEnum.approve;
  spenderAddress: string;
}

interface EvmTransferOperation extends EvmOperationBase {
  kind: ActivityOperKindEnum.transfer;
  type: ActivityOperTransferType;
  toAddress: string;
  fromAddress: string;
}

interface EvmInteractionOperation extends EvmOperationBase {
  kind: ActivityOperKindEnum.interaction;
  withAddress?: string;
}

export type EvmOperation = EvmApproveOperation | EvmTransferOperation | EvmInteractionOperation;

export interface EvmActivityAsset {
  contract: string;
  tokenId?: string;
  /** `null` for 'unlimited' amount */
  amountSigned?: string | null;
  decimals?: number;
  nft?: boolean;
  symbol?: string;
  name?: string;
  iconURL?: string;
}

export interface OperationMember {
  address: string;
  alias?: string;
}
