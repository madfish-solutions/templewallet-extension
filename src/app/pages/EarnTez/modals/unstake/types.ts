import BigNumber from 'bignumber.js';

import { TezosEarnReviewDataBase } from '../../types';

export interface ReviewData extends TezosEarnReviewDataBase {
  amount: BigNumber;
}
