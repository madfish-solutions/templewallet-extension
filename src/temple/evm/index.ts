import memoizee from 'memoizee';
import { createPublicClient, http } from 'viem';
import type * as ViemChainsModuleType from 'viem/chains';

import { MAX_MEMOIZED_TOOLKITS } from 'temple/misc';
import type { EvmNativeCurrency, StoredEvmNetwork } from 'temple/networks';

export const getReadOnlyEvm = memoizee(
  (rpcUrl: string) =>
    createPublicClient({
      transport: http(rpcUrl)
    }),
  { max: MAX_MEMOIZED_TOOLKITS }
);

// ts-prune-ignore-next
export const getReadOnlyEvmForNetwork = memoizee(
  (network: StoredEvmNetwork) =>
    createPublicClient({
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
    }),
  {
    max: MAX_MEMOIZED_TOOLKITS,
    normalizer: ([{ chainId, name, rpcBaseURL, currency }]) =>
      `${rpcBaseURL}${chainId}${name}${currency.decimals}${currency.symbol}${currency.name}`
  }
);

export const loadEvmChainInfo = memoizee(
  async (rpcUrl: string): Promise<{ chainId: number; currency: EvmNativeCurrency }> => {
    const client = createPublicClient({
      transport: http(rpcUrl)
    });

    const chainId = await client.getChainId();

    const ViemChains: typeof ViemChainsModuleType = await import('viem/chains');
    const currency = Object.values(ViemChains).find(chain => chain.id === chainId)?.nativeCurrency;

    if (!currency) throw new Error('Cannot resolve currency of the EVM network');

    return { chainId, currency };
  }
);
