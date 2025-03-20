import { HttpResponseError } from '@taquito/http-utils';
import BigNumber from 'bignumber.js';
import memoizee from 'memoizee';

import { BAKING_STAKE_SYNC_INTERVAL } from 'lib/fixed-times';
import { useRetryableSWR } from 'lib/swr';
import { getTezosFastRpcClient } from 'temple/tezos';

const COMMON_SWR_KEY = 'BAKING';
const COMMON_SWR_OPTIONS = {
  revalidateOnFocus: false,
  refreshInterval: BAKING_STAKE_SYNC_INTERVAL
};

export const useStakedAmount = (rpcUrl: string, accountPkh: string, suspense?: boolean) =>
  useRetryableSWR(
    [COMMON_SWR_KEY, 'get-staked', rpcUrl, accountPkh],
    () =>
      getTezosFastRpcClient(rpcUrl)
        .getStakedBalance(accountPkh)
        .catch(error => processIsStakingNotSupportedEndpointError(error, null)),
    { ...COMMON_SWR_OPTIONS, suspense }
  );

export const useUnstakeRequests = (rpcUrl: string, accountPkh: string, suspense?: boolean) =>
  useRetryableSWR(
    [COMMON_SWR_KEY, 'get-unstake-requests', rpcUrl, accountPkh],
    () =>
      getTezosFastRpcClient(rpcUrl)
        .getUnstakeRequests(accountPkh)
        .catch(error => processIsStakingNotSupportedEndpointError(error, null)),
    { ...COMMON_SWR_OPTIONS, suspense }
  );

export const useManagableTezosStakeInfo = (rpcURL: string, accountPkh: string) => {
  const stakedSwr = useStakedAmount(rpcURL, accountPkh);
  const requestsSwr = useUnstakeRequests(rpcURL, accountPkh);

  const requests = requestsSwr.data;
  const requestsN = requests ? requests.finalizable.length + requests.unfinalizable.requests.length : 0;

  const mayManage: boolean = stakedSwr.data?.gt(0) || Boolean(requestsN);

  const isLoading = stakedSwr.isLoading || requestsSwr.isLoading;

  return { mayManage, isLoading, requestsN };
};

export interface StakingCyclesInfo {
  blocks_per_cycle: number;
  /** In seconds */
  minimal_block_delay?: BigNumber;
  cooldownCyclesNumber: number;
}

export const useStakingCyclesInfo = (rpcUrl: string) =>
  useRetryableSWR([COMMON_SWR_KEY, 'get-cycles-info', rpcUrl], () => getCyclesInfo(rpcUrl), COMMON_SWR_OPTIONS);

const getCyclesInfo = memoizee(
  async (rpcUrl: string): Promise<StakingCyclesInfo | null> => {
    const rpc = getTezosFastRpcClient(rpcUrl);

    const { blocks_per_cycle, consensus_rights_delay, max_slashing_period, minimal_block_delay } =
      await rpc.getConstants();

    if (consensus_rights_delay == null && max_slashing_period == null) return null;

    const cooldownCyclesNumber = (consensus_rights_delay ?? 0) + (max_slashing_period ?? 0);

    return { blocks_per_cycle, minimal_block_delay, cooldownCyclesNumber };
  },
  { promise: true, max: 10 }
);

export const useBlockLevelInfo = (rpcUrl: string) => {
  const { data } = useRetryableSWR(
    [COMMON_SWR_KEY, 'get-level-info', rpcUrl],
    () =>
      getTezosFastRpcClient(rpcUrl)
        .getBlockMetadata()
        .then(m => m.level_info),
    COMMON_SWR_OPTIONS
  );

  return data;
};

export const useIsStakingNotSupported = (rpcUrl: string, bakerPkh: string | nullish) =>
  useRetryableSWR(
    [COMMON_SWR_KEY, 'is-staking-not-supported', rpcUrl, bakerPkh ?? 'by-chain'],
    () =>
      Promise.all([
        getIsStakingNotSupportedByChain(rpcUrl),
        bakerPkh ? getIsStakingNotSupportedByBaker(rpcUrl, bakerPkh) : false
      ]).then(([res1, res2]) => res1 || res2),
    COMMON_SWR_OPTIONS
  );

const getIsStakingNotSupportedByChain = memoizee(
  async (rpcUrl: string) => {
    const rpc = getTezosFastRpcClient(rpcUrl);

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
    getTezosFastRpcClient(rpcUrl)
      .getDelegateLimitOfStakingOverBakingIsPositive(bakerPkh)
      .catch(error => processIsStakingNotSupportedEndpointError(error, true)),
  { promise: true, normalizer: ([rpcUrl, bakerPkh]) => `${bakerPkh}@${rpcUrl}` }
);

const processIsStakingNotSupportedEndpointError = <T>(error: unknown, fallbackVal: T): T => {
  if (error instanceof HttpResponseError && error.status === 404) return fallbackVal;
  console.error(error);
  throw error;
};
