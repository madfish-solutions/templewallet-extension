import { BAKING_STAKE_SYNC_INTERVAL } from 'lib/fixed-times';
import { useTypedSWR } from 'lib/swr';
import { TezosNetworkEssentials } from 'temple/networks';
import { FALLBACK_TEZOS_NETWORK_TIMING, loadTezosNetworkTiming } from 'temple/tezos';

export const useTezosNetworkTiming = (network: TezosNetworkEssentials) => {
  const { data, isLoading } = useTypedSWR(
    ['tezos-network-timing', network.chainId, network.rpcBaseURL],
    () => loadTezosNetworkTiming(network),
    {
      fallbackData: FALLBACK_TEZOS_NETWORK_TIMING,
      refreshInterval: BAKING_STAKE_SYNC_INTERVAL,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  return { ...(data ?? FALLBACK_TEZOS_NETWORK_TIMING), isLoading };
};
