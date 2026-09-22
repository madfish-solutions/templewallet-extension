import type { LiFiStep } from '@lifi/sdk';
import { encodeFunctionData, erc20Abi, isAddress, isAddressEqual, numberToHex, zeroAddress } from 'viem';

import { getEvmStepTransaction } from 'lib/apis/temple/endpoints/evm';
import { getViemPublicClient } from 'temple/evm';
import type { EvmNetworkEssentials } from 'temple/networks';

import type { AlchemyCall } from './types';

export function canBatchLifiSteps(steps: LiFiStep[]): boolean {
  // Each top-level step requires a separate transaction. Internal steps belong to one LiFi call.
  return steps.length === 1;
}

export async function buildAlchemySwapCalls(
  steps: LiFiStep[],
  account: HexString,
  network: EvmNetworkEssentials,
  signal?: AbortSignal
): Promise<{ calls: AlchemyCall[]; steps: LiFiStep[] }> {
  if (!canBatchLifiSteps(steps) || steps[0].action.fromChainId !== network.chainId) {
    throw new Error('The batch requires one LiFi step on the active chain');
  }
  const client = getViemPublicClient(network);
  const calls: AlchemyCall[] = [];
  const step = steps[0];
  signal?.throwIfAborted();
  const prepared = await getEvmStepTransaction(step, signal);
  if (!prepared?.transactionRequest) throw new Error('LiFi did not return a transaction');
  const { transactionRequest: tx, action, estimate } = prepared;
  validateLifiRefresh(step, prepared);
  if (
    (tx.chainId !== undefined && Number(tx.chainId) !== network.chainId) ||
    !isAddress(tx.to ?? '') ||
    (tx.from !== undefined && !isAddressEqual(tx.from as HexString, account))
  )
    throw new Error('LiFi returned an invalid transaction');

  if (!isAddressEqual(action.fromToken.address as HexString, zeroAddress)) {
    const token = action.fromToken.address as HexString;
    const spender = estimate.approvalAddress as HexString;
    if (!isAddress(token) || !isAddress(spender)) throw new Error('LiFi returned an invalid approval');
    const allowance = await client.readContract({
      address: token,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [account, spender]
    });
    const amount = BigInt(action.fromAmount);
    if (allowance < amount) {
      // Reset a nonzero allowance for tokens such as USDT.
      if (allowance > 0n)
        calls.push({
          to: token,
          value: '0x0',
          data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [spender, 0n] })
        });
      calls.push({
        to: token,
        value: '0x0',
        data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [spender, amount] })
      });
    }
  }
  calls.push({
    to: tx.to as HexString,
    data: (tx.data ?? '0x') as HexString,
    value: numberToHex(BigInt(tx.value ?? 0))
  });
  return { calls, steps: [prepared] };
}

/** Use the first input and final output for the batch preview. LiFi transactions stay intact. */
export function getAlchemyBatchReviewStep(steps: LiFiStep[]): LiFiStep {
  const first = steps[0];
  const last = steps[steps.length - 1];
  return {
    ...last,
    action: {
      ...last.action,
      fromChainId: first.action.fromChainId,
      fromToken: first.action.fromToken,
      fromAmount: first.action.fromAmount,
      fromAddress: first.action.fromAddress
    },
    estimate: { ...last.estimate, fromAmount: first.estimate.fromAmount }
  };
}

/** Refresh prices and transaction terms, but retain the selected token pair and chains. */
export function validateLifiRefresh(previous: LiFiStep, refreshed: LiFiStep): void {
  const original = previous.action;
  const next = refreshed.action;
  if (
    original.fromChainId !== next.fromChainId ||
    original.toChainId !== next.toChainId ||
    original.fromToken.chainId !== next.fromToken.chainId ||
    original.toToken.chainId !== next.toToken.chainId ||
    next.fromToken.chainId !== next.fromChainId ||
    next.toToken.chainId !== next.toChainId ||
    !isAddressEqual(original.fromToken.address as HexString, next.fromToken.address as HexString) ||
    !isAddressEqual(original.toToken.address as HexString, next.toToken.address as HexString)
  )
    throw new Error('LiFi changed the token pair or chains');
}
