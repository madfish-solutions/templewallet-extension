import { useRewardsAddresses } from 'app/hooks/use-rewards-addresses';
import { DealsBalance, fetchDealsPendingBalance } from 'lib/apis/ads-api';
import { DEALS_PENDING_BALANCE_SYNC_INTERVAL } from 'lib/fixed-times';
import { useRetryableSWR } from 'lib/swr';

interface UseDealsPendingBalanceResult {
  pendingBalance: DealsBalance | null;
  isLoading: boolean;
  error: unknown;
}

export const useDealsPendingBalance = (): UseDealsPendingBalanceResult => {
  const { tezosAddress: rewardsAddress } = useRewardsAddresses();

  const { data, isLoading, error } = useRetryableSWR(
    rewardsAddress ? ['deals-pending-balance', rewardsAddress] : null,
    () => fetchDealsPendingBalance(rewardsAddress!),
    {
      refreshInterval: DEALS_PENDING_BALANCE_SYNC_INTERVAL,
      revalidateOnFocus: true,
      suspense: false
    }
  );

  return {
    pendingBalance: data ?? null,
    isLoading,
    error
  };
};
