import { HttpResponseError } from '@taquito/http-utils';
import BigNumber from 'bignumber.js';
import memoizee from 'memoizee';

import { BAKING_STAKE_SYNC_INTERVAL } from 'lib/fixed-times';
import { useRetryableSWR } from 'lib/swr';
import { loadFastRpcClient } from 'lib/temple/helpers';

const COMMON_SWR_KEY = 'BAKING';

export const useStakedAmount = (rpcUrl: string, accountPkh: string) =>
  useRetryableSWR(
    [COMMON_SWR_KEY, 'get-staked', rpcUrl, accountPkh],
    () => loadFastRpcClient(rpcUrl).getStakedBalance(accountPkh),
    { revalidateOnFocus: false }
  );

export const useUnstakeRequests = (rpcUrl: string, accountPkh: string, suspense?: boolean) =>
  useRetryableSWR(
    [COMMON_SWR_KEY, 'get-unstake-requests', rpcUrl, accountPkh],
    () => loadFastRpcClient(rpcUrl).getUnstakeRequests(accountPkh),
    { suspense, revalidateOnFocus: false }
  );

export interface StakingCyclesInfo {
  blocks_per_cycle: number;
  /** In seconds */
  minimal_block_delay?: BigNumber;
  cooldownCyclesLeft: number;
}

export const useStakingCyclesInfo = (rpcUrl: string) =>
  useRetryableSWR([COMMON_SWR_KEY, 'get-cycles-info', rpcUrl], () => getCyclesInfo(rpcUrl), {
    revalidateOnFocus: false
  });

const getCyclesInfo = memoizee(
  async (rpcUrl: string): Promise<StakingCyclesInfo | null> => {
    const rpc = loadFastRpcClient(rpcUrl);

    const { blocks_per_cycle, consensus_rights_delay, max_slashing_period, minimal_block_delay } =
      await rpc.getConstants();

    if (consensus_rights_delay == null && max_slashing_period == null) return null;

    const cooldownCyclesLeft =
      (consensus_rights_delay ?? 0) + (max_slashing_period ?? 0) - /* Accounting for current cycle*/ 1;

    return { blocks_per_cycle, minimal_block_delay, cooldownCyclesLeft };
  },
  { promise: true, max: 10 }
);

export const useBlockLevelInfo = (rpcUrl: string) => {
  const { data } = useRetryableSWR(
    [COMMON_SWR_KEY, 'get-level-info', rpcUrl],
    () =>
      loadFastRpcClient(rpcUrl)
        .getBlockMetadata()
        .then(m => m.level_info),
    {
      revalidateOnFocus: false,
      refreshInterval: BAKING_STAKE_SYNC_INTERVAL
    }
  );

  return data;
};

export const useIsStakingNotSupported = (rpcUrl: string) => {
  const { data, isLoading } = useRetryableSWR(
    [COMMON_SWR_KEY, 'is-staking-not-supported', rpcUrl],
    async () => {
      const rpc = loadFastRpcClient(rpcUrl);

      let launchCycle: number | null;
      try {
        launchCycle = await rpc.getAdaptiveIssuanceLaunchCycle();
        if (launchCycle == null) return true;
      } catch (error) {
        if (error instanceof HttpResponseError && error.status === 404) return true;
        console.error(error);
        throw error;
      }

      const { level_info } = await rpc.getBlockMetadata();

      if (level_info == null) return false;

      return level_info.cycle < launchCycle;
    },
    {
      revalidateOnFocus: false
    }
  );

  return data || isLoading;
};
