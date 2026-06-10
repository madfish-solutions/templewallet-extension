import { BigNumber } from 'bignumber.js';

import { useDealsRewardsStats } from 'app/hooks/use-rewards-stats';
import { useDealsEnabledSelector } from 'app/store/deals/selectors';

import { useDealsPendingBalance } from './use-deals-pending-balance';

type DealsRenderState = 'not-activated' | 'empty' | 'balances';

const deriveDealsRenderState = (
  enabled: boolean,
  allTime: BigNumber | null,
  pending: BigNumber | null
): DealsRenderState => {
  if (!enabled) return 'not-activated';
  const allTimeNonZero = Boolean(allTime && !allTime.isZero());
  const pendingNonZero = Boolean(pending && !pending.isZero());
  return allTimeNonZero || pendingNonZero ? 'balances' : 'empty';
};

export const useDealsStats = () => {
  const enabled = useDealsEnabledSelector();

  const { isLoading: isOnChainLoading, stats: onChainStats } = useDealsRewardsStats();

  const { pendingBalance, isLoading: isPendingLoading } = useDealsPendingBalance();

  const allTime = onChainStats?.total ?? null;
  const pending = pendingBalance?.pendingUsdt ?? null;
  const lastPendingAmount = pendingBalance?.lastPendingAmount ?? null;

  return {
    enabled,
    renderState: deriveDealsRenderState(enabled, allTime, pending),
    allTime,
    lastPayoutAmount: onChainStats?.lastAmount ?? null,
    pending,
    lastPendingAmount,
    isLoading: isOnChainLoading || isPendingLoading
  };
};
