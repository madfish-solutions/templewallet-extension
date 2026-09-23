import type { LiFiStep } from '@lifi/sdk';
import { encodeFunctionData, erc20Abi, isAddress, isAddressEqual, numberToHex, zeroAddress } from 'viem';

import { getEvmStepTransaction } from 'lib/apis/temple/endpoints/evm';
import { getViemPublicClient } from 'temple/evm';
import type { EvmNetworkEssentials } from 'temple/networks';

import type { AlchemyCall } from './types';

/**
 * All top-level steps must start on one chain. Only the final step can bridge to another chain.
 * Accepted: [Ethereum swap], [Ethereum -> Arbitrum bridge], [Ethereum swap, Ethereum swap],
 *           [Ethereum swap, Ethereum -> Arbitrum bridge].
 * Rejected: [], [Ethereum -> Arbitrum bridge, Arbitrum swap].
 * Internal includedSteps do not require separate wallet transactions.
 */
export function canBatchLifiSteps(steps: LiFiStep[]): boolean {
  if (!steps.length) return false;
  const chainId = steps[0].action.fromChainId;
  return steps.every(
    (step, index) =>
      step.action.fromChainId === chainId && (index === steps.length - 1 || step.action.toChainId === chainId)
  );
}

export async function buildAlchemySwapCalls(
  steps: LiFiStep[],
  account: HexString,
  network: EvmNetworkEssentials,
  signal?: AbortSignal
): Promise<{ calls: AlchemyCall[]; steps: LiFiStep[] }> {
  if (!canBatchLifiSteps(steps) || steps[0].action.fromChainId !== network.chainId) {
    throw new Error('The route requires transactions on separate chains');
  }
  const client = getViemPublicClient(network);
  const calls: AlchemyCall[] = [];
  const preparedSteps: LiFiStep[] = [];
  const remainingAllowances = new Map<string, bigint>();
  for (const step of steps) {
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
      const key = `${token}:${spender}`.toLowerCase();
      const allowance =
        remainingAllowances.get(key) ??
        (await client.readContract({
          address: token,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [account, spender]
        }));
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
      remainingAllowances.set(key, allowance < amount ? 0n : allowance - amount);
    }
    calls.push({
      to: tx.to as HexString,
      data: (tx.data ?? '0x') as HexString,
      value: numberToHex(BigInt(tx.value ?? 0))
    });
    preparedSteps.push(prepared);
  }
  return { calls, steps: preparedSteps };
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
