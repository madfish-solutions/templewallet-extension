import { BAKING_STAKE_SYNC_INTERVAL } from 'lib/fixed-times';
import { useInitialSuspenseSWR } from 'lib/swr';
import { TezosNetworkEssentials } from 'temple/networks';
import { loadTezosNetworkTiming } from 'temple/tezos';

export const useTezosNetworkTiming = (network: TezosNetworkEssentials) => {
  const timingPromise = loadTezosNetworkTiming(network);
  const { data } = useInitialSuspenseSWR(
    ['tezos-network-timing', network.chainId, network.rpcBaseURL],
    () => loadTezosNetworkTiming(network),
    timingPromise,
    {
      refreshInterval: BAKING_STAKE_SYNC_INTERVAL,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  return data;
};
