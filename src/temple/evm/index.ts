import memoizee from 'memoizee';
import { Transport, Chain, createPublicClient, http, PublicClient } from 'viem';

import { rejectOnTimeout } from 'lib/utils';
import { EvmChain } from 'temple/front';
import { MAX_MEMOIZED_TOOLKITS } from 'temple/misc';

import { getViemChainsList } from './utils';

export const getReadOnlyEvm = memoizee(
  (rpcUrl: string): PublicClient =>
    createPublicClient({
      transport: http(rpcUrl)
    }),
  { max: MAX_MEMOIZED_TOOLKITS }
);

type ChainPublicClient = PublicClient<Transport, Pick<Chain, 'id' | 'name' | 'nativeCurrency' | 'rpcUrls'>>;

/**
 * Some Viem Client methods will need chain definition to execute, use below fn in those cases
 */
export const getReadOnlyEvmForNetwork = memoizee(
  (network: EvmChain): ChainPublicClient => {
    const viemChain = getViemChainsList().find(chain => chain.id === network.chainId);

    if (viemChain) {
      return createPublicClient({ chain: viemChain, transport: http(network.rpcBaseURL) }) as ChainPublicClient;
    }

    return createPublicClient({
      chain: {
        id: network.chainId,
        name: network.name,
        nativeCurrency: network.currency,
        rpcUrls: {
          default: {
            http: [network.rpcBaseURL]
          }
        }
      },
      transport: http()
    });
  },
  {
    max: 10,
    normalizer: ([{ chainId, name, rpcBaseURL, currency }]) =>
      `${rpcBaseURL}${chainId}${name}${JSON.stringify(currency)}`
  }
);

export function loadEvmChainId(rpcUrl: string, timeout?: number) {
  const rpc = getReadOnlyEvm(rpcUrl);

  if (timeout && timeout > 0)
    return rejectOnTimeout(rpc.getChainId(), timeout, new Error('Timed-out for loadEvmChainId()'));

  return rpc.getChainId();
}
