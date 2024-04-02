import { useEffect } from 'react';

import { RpcClient } from '@taquito/rpc';
import { createPublicClient, http } from 'viem';

import { useEvmNetwork, useTezosNetwork } from 'temple/front';

/**
 * Note: fetching chain ID without memoization & cache.
 */
export const useChainIDsCheck = () => {
  const tezosNetwork = useTezosNetwork();

  useEffect(
    () =>
      void new RpcClient(tezosNetwork.rpcBaseURL).getChainId().then(chainId => {
        if (chainId !== tezosNetwork.chainId)
          alert(
            `Warning! Tezos RPC '${tezosNetwork.name}'(${tezosNetwork.rpcBaseURL}) has changed its network. Please, remove it & add again if needed.`
          );
      }),
    [tezosNetwork]
  );

  const evmNetwork = useEvmNetwork();

  useEffect(
    () =>
      void createPublicClient({
        transport: http(evmNetwork.rpcBaseURL)
      })
        .getChainId()
        .then(chainId => {
          if (chainId !== evmNetwork.chainId)
            alert(
              `Warning! EVM RPC '${evmNetwork.name}'(${evmNetwork.rpcBaseURL}) has changed its network. Please, remove it & add again if needed.`
            );
        }),
    [evmNetwork]
  );
};
