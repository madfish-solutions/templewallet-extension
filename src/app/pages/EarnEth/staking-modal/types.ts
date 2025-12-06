import BigNumber from 'bignumber.js';

import { EthEarnReviewDataBase } from '../types';

export interface ReviewData extends EthEarnReviewDataBase {
  amount: BigNumber;
}
