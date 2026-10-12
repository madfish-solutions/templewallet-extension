import type { Estimate } from '@lifi/sdk';

export function needsApprovalReset(estimate: Estimate, allowance: bigint, amount: bigint): boolean {
  return estimate.approvalReset === true && allowance > 0n && allowance < amount;
}
