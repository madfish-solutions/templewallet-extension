import memoizee from 'memoizee';
import { Transport, Chain, createPublicClient, http, PublicClient } from 'viem';
import * as ViemChains from 'viem/chains';

import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { EvmAssetStandard } from 'lib/evm/types';
import { EvmNativeTokenMetadata } from 'lib/metadata/types';
import { EvmChain } from 'temple/front';
import { MAX_MEMOIZED_TOOLKITS } from 'temple/misc';

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
    const viemChain = Object.values(ViemChains).find(chain => chain.id === network.chainId);

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

export interface EvmChainInfo {
  chainId: number;
  currency: EvmNativeTokenMetadata;
  testnet: boolean;
}

export const loadEvmChainInfo = memoizee(async (rpcUrl: string): Promise<EvmChainInfo> => {
  const client = createPublicClient({
    transport: http(rpcUrl)
  });

  const chainId = await client.getChainId();

  const viemChain = Object.values(ViemChains).find(chain => chain.id === chainId);

  if (!viemChain) throw new Error('Cannot resolve currency of the EVM network');

  const currency: EvmNativeTokenMetadata = {
    standard: EvmAssetStandard.NATIVE,
    address: EVM_TOKEN_SLUG,
    ...viemChain.nativeCurrency
  };

  return { chainId, currency, testnet: viemChain.testnet ?? false };
});
