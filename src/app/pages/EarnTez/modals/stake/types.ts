import BigNumber from 'bignumber.js';

import { TezosReviewData as GenericTezosReviewData } from 'lib/temple/front/estimation-data-providers/types';

export interface DelegationReviewData {
  amount: BigNumber;
  onConfirm: EmptyFn;
}

export type ReviewData = GenericTezosReviewData<DelegationReviewData>;
