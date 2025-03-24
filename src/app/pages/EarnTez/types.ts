import { TezosReviewData } from 'lib/temple/front/estimation-data-providers';

export type TezosEarnReviewDataBase = TezosReviewData<{ onConfirm: SyncFn<string> }>;
