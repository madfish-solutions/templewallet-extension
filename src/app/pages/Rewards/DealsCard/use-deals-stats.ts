import { BigNumber } from 'bignumber.js';

import { useRewardsAddresses } from 'app/hooks/use-rewards-addresses';
import { useRewardsStatsEntry } from 'app/pages/Rewards/use-rewards-stats-entry';
import { useDealsEnabledSelector } from 'app/store/deals/selectors';
import { USDT_TOKEN_METADATA } from 'lib/assets/known-tokens';
import { DEALS_REWARDS_STATS_STORAGE_KEY } from 'lib/constants';

import { DEALS_PAYOUT_ADDRESS } from '../constants';

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

const usdtMeta = {
  contract: USDT_TOKEN_METADATA.address,
  tokenId: USDT_TOKEN_METADATA.id,
  decimals: USDT_TOKEN_METADATA.decimals
};

export const useDealsStats = () => {
  const enabled = useDealsEnabledSelector();
  const { tezosAddress: rewardsAddress } = useRewardsAddresses();

  const { isLoading: isOnChainLoading, stats: onChainStats } = useRewardsStatsEntry(
    DEALS_REWARDS_STATS_STORAGE_KEY,
    DEALS_PAYOUT_ADDRESS,
    rewardsAddress,
    usdtMeta,
    'Failed to load Deals USDT stats: '
  );

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
