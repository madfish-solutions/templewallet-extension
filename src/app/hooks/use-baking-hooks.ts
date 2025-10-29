import { HttpResponseError } from '@taquito/http-utils';
import BigNumber from 'bignumber.js';
import memoizee from 'memoizee';

import { BAKING_STAKE_SYNC_INTERVAL } from 'lib/fixed-times';
import { useRetryableSWR } from 'lib/swr';
import { TezosNetworkEssentials } from 'temple/networks';
import { getTezosRpcClient } from 'temple/tezos';

const COMMON_SWR_KEY = 'BAKING';
const COMMON_SWR_OPTIONS = {
  revalidateOnFocus: false,
  refreshInterval: BAKING_STAKE_SYNC_INTERVAL
};

export const useStakedAmount = (network: TezosNetworkEssentials, accountPkh: string, suspense?: boolean) =>
  useRetryableSWR(
    [COMMON_SWR_KEY, 'get-staked', network, accountPkh],
    () =>
      getTezosRpcClient(network)
        .getStakedBalance(accountPkh)
        .catch(error => processIsStakingNotSupportedEndpointError(error, null)),
    { ...COMMON_SWR_OPTIONS, suspense }
  );

export const useUnstakeRequests = (network: TezosNetworkEssentials, accountPkh: string, suspense?: boolean) =>
  useRetryableSWR(
    [COMMON_SWR_KEY, 'get-unstake-requests', network, accountPkh],
    () =>
      getTezosRpcClient(network)
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

export const useStakingCyclesInfo = (network: TezosNetworkEssentials) =>
  useRetryableSWR([COMMON_SWR_KEY, 'get-cycles-info', network], () => getCyclesInfo(network), COMMON_SWR_OPTIONS);

const getCyclesInfo = memoizee(
  async (network: TezosNetworkEssentials): Promise<StakingCyclesInfo | null> => {
    const rpc = getTezosRpcClient(network);

    const { blocks_per_cycle, minimal_block_delay, unstake_finalization_delay } = await rpc.getConstants();

    const cooldownCyclesNumber = unstake_finalization_delay + 1;

    return { blocks_per_cycle, minimal_block_delay, cooldownCyclesNumber };
  },
  {
    promise: true,
    max: 10,
    normalizer: ([network]) => JSON.stringify(network)
  }
);

export const useBlockLevelInfo = (network: TezosNetworkEssentials) => {
  const { data } = useRetryableSWR(
    [COMMON_SWR_KEY, 'get-level-info', network],
    () =>
      getTezosRpcClient(network)
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
