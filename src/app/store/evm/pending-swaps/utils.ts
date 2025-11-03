import { EVM_FALLBACK_RPC_URLS, EvmNetworkEssentials } from 'temple/networks';

/**
 * Creates EvmNetworkEssentials from chainId using fallback RPC URLs
 * This is useful when we only have the chainId stored and need to reconstruct the network object
 */
export function getEvmNetworkEssentialsByChainId(chainId: number): EvmNetworkEssentials | null {
  const rpcUrls = EVM_FALLBACK_RPC_URLS[chainId];

  if (!rpcUrls || rpcUrls.length === 0) {
    console.error(`No RPC URLs found for chain ID ${chainId}`);
    return null;
  }

  return {
    chainId,
    rpcBaseURL: rpcUrls[0] // Use first fallback RPC URL
  };
}
