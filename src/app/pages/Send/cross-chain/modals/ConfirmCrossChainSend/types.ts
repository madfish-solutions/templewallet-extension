import { CrossChainPhase } from 'app/store/cross-chain-send/state';
import { CrossChainAsset } from 'lib/cross-chain';

export enum ConfirmCrossChainStep {
  Preview = 'preview',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed'
}

export const phaseToConfirmStep = (phase: CrossChainPhase): ConfirmCrossChainStep => {
  if (phase === 'COMPLETED') return ConfirmCrossChainStep.Completed;
  if (phase === 'FAILED') return ConfirmCrossChainStep.Failed;
  return ConfirmCrossChainStep.Processing;
};

export interface ConfirmCrossChainReviewData {
  fromAsset: CrossChainAsset;
  toAsset: CrossChainAsset;
  fromAmount: string;
  toAmountEstimated: string;
  recipient: string;
}
