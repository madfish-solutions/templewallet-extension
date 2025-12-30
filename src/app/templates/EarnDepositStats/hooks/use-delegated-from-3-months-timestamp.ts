import { getDelegatorRewards, TzktApiChainId } from 'lib/apis/tzkt';
import { getCycles } from 'lib/apis/tzkt/api';
import type { TzktCycle } from 'lib/apis/tzkt/types';
import { useTypedSWR } from 'lib/swr';

/**
 * Checks delegator rewards from the past 3 months to determine the delegation timestamp of the account.
 */
export const useDelegatedFrom3MonthsTimestamp = (accountPkh: string, chainId: TzktApiChainId) =>
  useTypedSWR<number | null>(
    ['delegated-from-3-month-timestamp', chainId, accountPkh],
    async () => {
      const rewards = await getDelegatorRewards(chainId, { address: accountPkh, limit: 100 }).then(res => res || []);

      if (!rewards.length) {
        return null;
      }

      const [newestCycle] = await getCycles(chainId, undefined, 1);
      const newestRewardCycle = rewards[0].cycle;
      const oldestRewardCycle = rewards[rewards.length - 1].cycle;

      const cyclesRangeStart = newestCycle.index - newestRewardCycle;
      const cyclesRangeLimit = newestRewardCycle - oldestRewardCycle + 1;

      const cycles = await getCycles(chainId, cyclesRangeStart, cyclesRangeLimit);
      const cyclesByIndex = new Map<number, TzktCycle>(cycles.map(cycle => [cycle.index, cycle]));
      const oldestCycle = cyclesByIndex.get(oldestRewardCycle);

      if (!oldestCycle) {
        return null;
      }

      return new Date(oldestCycle.startTime).getTime();
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
