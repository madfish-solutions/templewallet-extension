import {
  EvmReviewData as GenericEvmReviewData,
  TezosReviewData as GenericTezosReviewData,
  ReviewData as GenericReviewData
} from 'lib/temple/front/estimation-data-providers';
import { TempleChainKind } from 'temple/types';

export interface SendFormData {
  amount: string;
  to: string;
}

interface BaseReviewData extends SendFormData {
  assetSlug: string;
  onConfirm: EmptyFn;
}

export type EvmReviewData = GenericEvmReviewData<BaseReviewData>;

export type TezosReviewData = GenericTezosReviewData<BaseReviewData>;

export type ReviewData = GenericReviewData<BaseReviewData>;

export type PendingSendReview = {
  kind: TempleChainKind;
  chainId: string | number;
  assetSlug: string;
  to: string;
  amount: string;
  selectedChainAssetSlug: string;
};
