import type { Estimate } from '@lifi/sdk';
import { encodeFunctionData } from 'viem';

import { erc20ApproveAbi } from 'lib/abi/erc20';
import { estimate as genericEstimate } from 'temple/evm/estimate';
import { EvmNetworkEssentials } from 'temple/networks';

export function needsApprovalReset(estimate: Estimate, allowance: bigint, amount: bigint): boolean {
  return estimate.approvalReset === true && allowance > 0n && allowance < amount;
}

export const buildApprovalTxData = (spender: HexString, amount: bigint) =>
  encodeFunctionData({ abi: [erc20ApproveAbi], functionName: 'approve', args: [spender, amount] });

export const estimateApprovalTx = (
  network: EvmNetworkEssentials,
  accountPkh: HexString,
  tokenAddress: HexString,
  txData: HexString
) => genericEstimate(network, { from: accountPkh, to: tokenAddress, value: BigInt(0), data: txData });
