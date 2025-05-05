import memoizee from 'memoizee';
import { Transport, Chain, createPublicClient, PublicClient, http } from 'viem';

import { rejectOnTimeout } from 'lib/utils';

import { MAX_MEMOIZED_TOOLKITS } from '../misc';
import { EvmNetworkEssentials } from '../networks';

import { getCustomViemChain, getViemChainByChainId, getViemTransportForNetwork } from './utils';

export type ChainPublicClient = PublicClient<Transport, Pick<Chain, 'id' | 'name' | 'nativeCurrency' | 'rpcUrls'>>;

/**
 * Some Viem Client methods will need chain definition to execute, use below fn in those cases
 */
export const getViemPublicClient = memoizee(
  (network: EvmNetworkEssentials): ChainPublicClient => {
    const viemChain = getViemChainByChainId(network.chainId);

    if (viemChain) {
      return createPublicClient({ chain: viemChain, transport: getViemTransportForNetwork(network) });
    }

    return createPublicClient({
      chain: getCustomViemChain(network),
      transport: getViemTransportForNetwork(network)
    });
  },
  {
    max: MAX_MEMOIZED_TOOLKITS,
    normalizer: args => JSON.stringify(args)
  }
);

export function loadEvmChainId(rpcUrl: string, timeout?: number) {
  const client = createPublicClient({ transport: http(rpcUrl) });

  if (timeout && timeout > 0)
    return rejectOnTimeout(client.getChainId(), timeout, new Error('Timed-out for loadEvmChainId()'));

  return client.getChainId();
}
