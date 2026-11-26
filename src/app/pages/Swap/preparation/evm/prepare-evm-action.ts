import type { LiFiStep } from '@lifi/sdk';
import { isAddress } from 'viem';

import { getEvmStepTransaction } from 'lib/apis/temple/endpoints/evm';
import { toTokenSlug } from 'lib/assets';
import { prepareAlchemySwapBatch } from 'lib/evm/alchemy/prepare-batch';
import { getAlchemyBatchReviewStep } from 'lib/evm/alchemy/swap';
import { buildApprovalTxData, estimateApprovalTx } from 'lib/evm/approval';
import { EvmAssetMetadata } from 'lib/metadata/types';
import { DEFAULT_FEE_OPTION } from 'lib/temple/front/estimation-data-providers';
import { atomsToTokens } from 'lib/temple/helpers';
import { useAllEvmChains } from 'temple/front';

import { estimateEvmSend } from '../../../Send/estimate-evm-send';
import { UserAction } from '../../evm/user-actions';
import { getCommonStepProps, isLifiStep } from '../../form/interfaces';
import { getTokenSlugFromEvmDexTokenAddress } from '../../utils';
import { PreparedEvmAction, PreparedEvmBatchAction, PreparedEvmStepAction } from '../types';

export interface EvmActionContext {
  accountPkh: HexString;
  chains: ReturnType<typeof useAllEvmChains>;
  getMetadata: (chainId: number, slug: string) => EvmAssetMetadata | undefined;
}

export const matchesUserAction = (prepared: PreparedEvmAction, action: UserAction) => {
  switch (prepared.kind) {
    case 'batch':
      return action.type === 'execute' && Boolean(action.batchSteps);
    case 'execute':
      return action.type === 'execute' && !action.batchSteps && action.stepIndex === prepared.stepIndex;
    case 'approval':
      return action.type === (prepared.reset ? 'reset-approval' : 'approve') && action.stepIndex === prepared.stepIndex;
  }
};

export const prepareEvmBatchAction = async (
  steps: LiFiStep[],
  { accountPkh, chains }: EvmActionContext,
  signal: AbortSignal
): Promise<PreparedEvmBatchAction> => {
  const network = chains[getCommonStepProps(getAlchemyBatchReviewStep(steps)).fromChainId];
  if (!network) throw new Error('Unknown input chain');

  const batch = await prepareAlchemySwapBatch(steps, accountPkh, network, DEFAULT_FEE_OPTION, signal);

  return { kind: 'batch', ...batch };
};

export const prepareEvmStepAction = async (
  action: UserAction,
  { accountPkh, chains, getMetadata }: EvmActionContext,
  signal: AbortSignal
): Promise<PreparedEvmStepAction> => {
  if (action.batchSteps) throw new Error('A batch is prepared with prepareEvmBatchAction');

  const { fromChainId, fromToken, fromAmount, approvalAddress } = getCommonStepProps(action.routeStep);
  const network = chains[fromChainId];
  if (!network) throw new Error('Unknown input chain');

  if (action.type === 'execute') {
    const step = isLifiStep(action.routeStep)
      ? await getEvmStepTransaction(action.routeStep, signal)
      : action.routeStep;
    signal.throwIfAborted();

    const to = getCommonStepProps(step).txDestination;
    if (!to || !isAddress(to)) throw new Error('Invalid transaction destination');

    const assetMetadata = getMetadata(fromChainId, getTokenSlugFromEvmDexTokenAddress(fromToken.address));
    if (!assetMetadata) throw new Error('Asset metadata not found');

    const estimation = await estimateEvmSend({
      network,
      accountPkh,
      to,
      assetMetadata,
      amount: atomsToTokens(fromAmount, fromToken.decimals ?? 0).toFixed()
    });

    return { kind: 'execute', stepIndex: action.stepIndex, step, estimation };
  }

  const reset = action.type === 'reset-approval';
  const spender = approvalAddress ?? '';
  const tokenAddress = getMetadata(fromChainId, toTokenSlug(fromToken.address, 0))?.address ?? '';
  if (!isAddress(spender, { strict: false }) || !isAddress(tokenAddress, { strict: false })) {
    throw new Error('Invalid approval addresses');
  }

  const txData = buildApprovalTxData(spender, reset ? 0n : BigInt(fromAmount));
  const estimation = await estimateApprovalTx(network, accountPkh, tokenAddress, txData);

  return { kind: 'approval', stepIndex: action.stepIndex, reset, txData, estimation };
};
