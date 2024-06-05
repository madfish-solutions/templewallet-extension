import { HttpResponseError } from '@taquito/http-utils';
import BigNumber from 'bignumber.js';
import memoizee from 'memoizee';

import { BAKING_STAKE_SYNC_INTERVAL } from 'lib/fixed-times';
import { useRetryableSWR } from 'lib/swr';
import { loadFastRpcClient } from 'lib/temple/helpers';

const COMMON_SWR_KEY = 'BAKING';
const COMMON_SWR_OPTIONS = {
  revalidateOnFocus: false,
  refreshInterval: BAKING_STAKE_SYNC_INTERVAL
};

export const useStakedAmount = (rpcUrl: string, accountPkh: string) =>
  useRetryableSWR(
    [COMMON_SWR_KEY, 'get-staked', rpcUrl, accountPkh],
    () =>
      loadFastRpcClient(rpcUrl)
        .getStakedBalance(accountPkh)
        .catch(error => processIsStakingNotSupportedEndpointError(error, null)),
    COMMON_SWR_OPTIONS
  );

export const useUnstakeRequests = (rpcUrl: string, accountPkh: string, suspense?: boolean) =>
  useRetryableSWR(
    [COMMON_SWR_KEY, 'get-unstake-requests', rpcUrl, accountPkh],
    () =>
      loadFastRpcClient(rpcUrl)
        .getUnstakeRequests(accountPkh)
        .catch(error => processIsStakingNotSupportedEndpointError(error, null)),
    { ...COMMON_SWR_OPTIONS, suspense }
  );

export interface StakingCyclesInfo {
  blocks_per_cycle: number;
  /** In seconds */
  minimal_block_delay?: BigNumber;
  cooldownCyclesLeft: number;
}

export const useStakingCyclesInfo = (rpcUrl: string) =>
  useRetryableSWR([COMMON_SWR_KEY, 'get-cycles-info', rpcUrl], () => getCyclesInfo(rpcUrl), COMMON_SWR_OPTIONS);

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
    COMMON_SWR_OPTIONS
  );

  return data;
};

export const useIsStakingNotSupported = (rpcUrl: string, bakerPkh: string) =>
  useRetryableSWR(
    [COMMON_SWR_KEY, 'is-staking-not-supported', rpcUrl, bakerPkh],
    () =>
      Promise.all([getIsStakingNotSupportedByChain(rpcUrl), getIsStakingNotSupportedByBaker(rpcUrl, bakerPkh)]).then(
        ([res1, res2]) => res1 || res2
      ),
    COMMON_SWR_OPTIONS
  );

const getIsStakingNotSupportedByChain = memoizee(
  async (rpcUrl: string) => {
    const rpc = loadFastRpcClient(rpcUrl);

    let launchCycle: number | null;
    try {
      launchCycle = await rpc.getAdaptiveIssuanceLaunchCycle();
      if (launchCycle == null) return true;
    } catch (error) {
      return processIsStakingNotSupportedEndpointError(error, true);
    }

    const { level_info } = await rpc.getBlockMetadata();

    if (level_info == null) return false;

    return level_info.cycle < launchCycle;
  },
  { promise: true }
);

const getIsStakingNotSupportedByBaker = memoizee(
  (rpcUrl: string, bakerPkh: string) =>
    loadFastRpcClient(rpcUrl)
      .getDelegateLimitOfStakingOverBakingIsPositive(bakerPkh)
      .catch(error => processIsStakingNotSupportedEndpointError(error, true)),
  { promise: true, normalizer: ([rpcUrl, bakerPkh]) => `${bakerPkh}@${rpcUrl}` }
);

const processIsStakingNotSupportedEndpointError = <T>(error: unknown, fallbackVal: T): T => {
  if (error instanceof HttpResponseError && error.status === 404) return fallbackVal;
  console.error(error);
  throw error;
};
