import type { LiFiStep } from '@lifi/sdk';

export const getBatchKey = (steps: LiFiStep[]): string =>
  JSON.stringify(
    steps.map(step => [
      step.tool,
      step.action.fromChainId,
      step.action.toChainId,
      step.action.fromToken.address.toLowerCase(),
      step.action.toToken.address.toLowerCase(),
      step.action.fromAmount,
      step.action.fromAddress?.toLowerCase(),
      step.action.toAddress?.toLowerCase()
    ])
  );
