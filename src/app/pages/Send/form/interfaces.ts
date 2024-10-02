import { EvmChain, TezosChain } from 'temple/front';

export interface SendFormData {
  amount: string;
  to: string;
}

interface BaseReviewData extends SendFormData {
  assetSlug: string;
}

export interface EvmReviewData extends BaseReviewData {
  accountPkh: HexString;
  network: EvmChain;
}

export interface TezosReviewData extends BaseReviewData {
  accountPkh: string;
  network: TezosChain;
}

export type ReviewData = TezosReviewData | EvmReviewData;
