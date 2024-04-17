import { useEffect } from 'react';

import { RpcClient } from '@taquito/rpc';
import { createPublicClient, http } from 'viem';

import { useAllEvmChains, useAllTezosChains } from 'temple/front';

/**
 * Note: fetching chains' IDs without memoization & cache.
 *
 * If user-action is applied, need to:
 * - Remove (replace) RPC
 * - Reload page to clear-out all runtime-memoized values by `chainId` + `rpcUrl` key
 */
export const useChainIDsCheck = () => {
  const tezosNetworks = useAllTezosChains();

  useEffect(
    () =>
      Object.values(tezosNetworks).forEach(network =>
        new RpcClient(network.rpcBaseURL).getChainId().then(chainId => {
          if (chainId !== network.chainId)
            alert(
              `Warning! Tezos RPC '${network.name}'(${network.rpcBaseURL}) has changed its network (${chainId} !== ${network.chainId}).`
            );
        })
      ),
    [tezosNetworks]
  );

  const evmNetworks = useAllEvmChains();

  useEffect(
    () =>
      Object.values(evmNetworks).forEach(network =>
        createPublicClient({
          transport: http(network.rpcBaseURL)
        })
          .getChainId()
          .then(chainId => {
            if (chainId !== network.chainId)
              alert(
                `Warning! EVM RPC '${network.name}'(${network.rpcBaseURL}) has changed its network. (${chainId} !== ${network.chainId})`
              );
          })
      ),
    [evmNetworks]
  );
};
