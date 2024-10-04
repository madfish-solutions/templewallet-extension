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
}

interface OperationBase {
  kind: ActivityOperKindEnum;
  /** `null` for 'unlimited' amount */
  amountSigned?: string | null;
}

export interface TezosActivity extends ChainActivityBase, TezosActivityOlderThan {
  chain: TempleChainKind.Tezos;
  chainId: string;
  blockExplorerUrl?: string;
  operations: TezosOperation[];
}

export interface TezosOperation extends OperationBase {
  assetSlug?: string;
}

export interface TezosActivityAsset extends ActivityAssetBase {}

export interface EvmActivity extends ChainActivityBase {
  chain: TempleChainKind.EVM;
  chainId: number;
  blockExplorerUrl?: string;
  operations: EvmOperation[];
}

export interface EvmOperation extends OperationBase {
  asset?: EvmActivityAsset; // TODO: Same as for Tezos
}

export interface EvmActivityAsset extends ActivityAssetBase {
  iconURL?: string;
}

interface ActivityAssetBase {
  contract: string;
  tokenId?: string;
  /** Signed (with `-` if applicable). `null` for 'unlimited' amount */
  amount?: string | null;
  decimals: number;
  nft?: boolean;
  symbol?: string;
}

export interface OperationMember {
  address: string;
  alias?: string;
}
