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

const processIsStakingNotSupportedEndpointError = <T>(error: unknown, fallbackVal: T): T => {
  if (error instanceof HttpResponseError && error.status === 404) return fallbackVal;
  console.error(error);
  throw error;
};
