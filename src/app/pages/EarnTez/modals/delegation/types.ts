import { Baker } from 'lib/temple/front';
import { TezosReviewData as GenericTezosReviewData } from 'lib/temple/front/estimation-data-providers/types';

export interface DelegationReviewData {
  baker: string | Baker;
  onConfirm: EmptyFn;
}

export type ReviewData = GenericTezosReviewData<DelegationReviewData>;
