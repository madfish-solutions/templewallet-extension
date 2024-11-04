import { AccountForChain } from 'temple/accounts';
import { EvmChain, TezosChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

export interface SendFormData {
  amount: string;
  to: string;
}

interface BaseReviewData extends SendFormData {
  assetSlug: string;
  onConfirm: EmptyFn;
}

export interface EvmReviewData extends BaseReviewData {
  account: AccountForChain<TempleChainKind.EVM>;
  network: EvmChain;
}

export interface TezosReviewData extends BaseReviewData {
  account: AccountForChain<TempleChainKind.Tezos>;
  network: TezosChain;
}

export type ReviewData = TezosReviewData | EvmReviewData;
