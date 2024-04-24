import { useCallback, useEffect } from 'react';

import { RpcClient } from '@taquito/rpc';
import { createPublicClient, http } from 'viem';

import { useAlert } from 'lib/ui';
import { OneOfChains, useAllEvmChains, useAllTezosChains } from 'temple/front';
import { TempleChainTitle } from 'temple/types';

/**
 * Note: fetching chains' IDs without memoization & cache.
 *
 * TODO: Present consistent with UI dialog (instead of `alert`) with user action to:
 * - Remove (replace) RPC & various cache
 * - Reload page to clear-out all runtime-memoized values by `chainId` + `rpcUrl` key
 */
export const useChainIDsCheck = () => {
  const tezosChains = useAllTezosChains();

  const customAlert = useAlert();

  const handleChainIdMissmatch = useCallback(
    (chain: OneOfChains, chainId: string | number) =>
      void customAlert({
        title: `Warning!`,
        children: `${TempleChainTitle[chain.kind]} RPC '${chain.name}'(${
          chain.rpcBaseURL
        }) has changed its network. (${chainId} !== ${chain.chainId})`
      }),
    []
  );

  useEffect(() => {
    for (const chain of Object.values(tezosChains)) {
      const rpcClient = new RpcClient(chain.rpcBaseURL);

      rpcClient.getChainId().then(chainId => {
        if (chainId !== chain.chainId) handleChainIdMissmatch(chain, chainId);
      });
    }
  }, [tezosChains]);

  const evmChains = useAllEvmChains();

  useEffect(() => {
    for (const chain of Object.values(evmChains)) {
      const rpcClient = createPublicClient({
        transport: http(chain.rpcBaseURL)
      });

      rpcClient.getChainId().then(chainId => {
        if (chainId !== chain.chainId) handleChainIdMissmatch(chain, chainId);
      });
    }
  }, [evmChains]);
};
