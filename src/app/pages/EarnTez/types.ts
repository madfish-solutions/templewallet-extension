import { TezosReviewData } from 'lib/temple/front/estimation-data-providers/types';

export type TezosEarnReviewDataBase = TezosReviewData<{ onConfirm: SyncFn<string> }>;
