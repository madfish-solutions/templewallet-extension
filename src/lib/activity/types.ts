import { TempleChainKind } from 'temple/types';

import { TezosActivityOlderThan } from './tezos/types';

export enum ActivityOperKindEnum {
  interaction,
  transferFrom,
  transferTo,
  transferFrom_ToAccount,
  transferTo_FromAccount,
  swap,
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
  status: ActivityStatus;
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

interface TezosTransferOperation extends TezosOperationBase {
  kind: ActivityOperTransferKinds;
  fromAddress: string;
  toAddress: string;
}

interface TezosInteractionOperation extends TezosOperationBase {
  kind: ActivityOperKindEnum.interaction;
  withAddress?: string;
}

interface TezosOtherOperation extends TezosOperationBase {
  kind: Exclude<
    ActivityOperKindEnum,
    ActivityOperKindEnum.approve | ActivityOperTransferKinds | ActivityOperKindEnum.interaction
  >;
}

export type TezosOperation =
  | TezosApproveOperation
  | TezosTransferOperation
  | TezosInteractionOperation
  | TezosOtherOperation;

export interface EvmActivity extends ChainActivityBase {
  chain: TempleChainKind.EVM;
  chainId: number;
  blockExplorerUrl?: string;
  operations: EvmOperation[];
}

interface EvmOperationBase extends OperationBase {
  asset?: EvmActivityAsset;
}

interface EvmApproveOperation extends EvmOperationBase {
  kind: ActivityOperKindEnum.approve;
  spenderAddress: string;
}

export type ActivityOperTransferKinds =
  | ActivityOperKindEnum.transferFrom
  | ActivityOperKindEnum.transferFrom_ToAccount
  | ActivityOperKindEnum.transferTo
  | ActivityOperKindEnum.transferTo_FromAccount;

interface EvmTransferOperation extends EvmOperationBase {
  kind: ActivityOperTransferKinds;
  toAddress: string;
  fromAddress: string;
}

interface EvmInteractionOperation extends EvmOperationBase {
  kind: ActivityOperKindEnum.interaction;
  withAddress?: string;
}

interface EvmOtherOperation extends EvmOperationBase {
  kind: Exclude<
    ActivityOperKindEnum,
    ActivityOperKindEnum.approve | ActivityOperTransferKinds | ActivityOperKindEnum.interaction
  >;
}

export type EvmOperation = EvmApproveOperation | EvmTransferOperation | EvmInteractionOperation | EvmOtherOperation;

export interface EvmActivityAsset {
  contract: string;
  tokenId?: string;
  /** `null` for 'unlimited' amount */
  amountSigned?: string | null;
  decimals?: number;
  nft?: boolean;
  symbol?: string;
  iconURL?: string;
}

export interface OperationMember {
  address: string;
  alias?: string;
}
