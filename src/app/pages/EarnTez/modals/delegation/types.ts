import { Baker } from 'lib/temple/front';

import { TezosEarnReviewDataBase } from '../../types';

export interface ReviewData extends TezosEarnReviewDataBase {
  baker: string | Baker;
}
