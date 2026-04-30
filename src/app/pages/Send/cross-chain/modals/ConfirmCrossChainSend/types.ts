import { CrossChainAsset } from 'lib/cross-chain';

export enum ConfirmCrossChainStep {
  Preview = 'preview',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed'
}

export interface ConfirmCrossChainReviewData {
  fromAsset: CrossChainAsset;
  toAsset: CrossChainAsset;
  fromAmount: string;
  toAmountEstimated: string;
  recipient: string;
}
