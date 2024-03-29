import memoizee from 'memoizee';
import { createPublicClient, http } from 'viem';
import type * as ViemChainsModuleType from 'viem/chains';

import type { EvmNativeCurrency } from 'temple/networks';

export const loadEvmChainInfo = memoizee(
  async (rpcUrl: string): Promise<{ chainId: number; currency: EvmNativeCurrency }> => {
    const client = createPublicClient({
      chain: {
        id: 0,
        name: 'mock',
        nativeCurrency: { name: 'mock', symbol: 'mock', decimals: 18 },
        rpcUrls: {
          default: {
            http: [rpcUrl]
          }
        }
      },
      transport: http()
    });

    const chainId = await client.getChainId();

    const ViemChains: typeof ViemChainsModuleType = await import('viem/chains');
    const currency = Object.values(ViemChains).find(chain => chain.id === chainId)?.nativeCurrency;

    if (!currency) throw new Error('Cannot resolve currency of the EVM network');

    return { chainId, currency };
  }
);
