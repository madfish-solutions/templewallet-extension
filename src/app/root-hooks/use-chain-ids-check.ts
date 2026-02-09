import { useCallback, useEffect } from 'react';

import { RpcClient } from '@tezos-x/octez.js-rpc';
import { createPublicClient, http } from 'viem';

import { useAlert } from 'lib/ui';
import { OneOfChains, useEnabledEvmChains, useEnabledTezosChains } from 'temple/front';
import { TempleChainTitle } from 'temple/types';

/**
 * Note: fetching chains' IDs without memoization & cache.
 *
 * TODO: Present consistent with UI dialog (instead of `alert`) with user action to:
 * - Remove (replace) RPC & various cache
 * - Reload page to clear-out all runtime-memoized values by `chainId` + `rpcUrl` key
 */
export const useChainIDsCheck = () => {
  const tezosChains = useEnabledTezosChains();

  const customAlert = useAlert();

  const handleChainIdMissmatch = useCallback(
    (chain: OneOfChains, chainId: string | number) =>
      void customAlert({
        title: `Warning!`,
        children: `${TempleChainTitle[chain.kind]} RPC '${chain.name}'(${
          chain.rpcBaseURL
        }) has changed its network. (${chainId} !== ${chain.chainId})`
      }),
    [customAlert]
  );

  useEffect(() => {
    for (const chain of Object.values(tezosChains)) {
      const rpcClient = new RpcClient(chain.rpcBaseURL);

      rpcClient.getChainId().then(chainId => {
        if (chainId !== chain.chainId) handleChainIdMissmatch(chain, chainId);
      });
    }
  }, [handleChainIdMissmatch, tezosChains]);

  const evmChains = useEnabledEvmChains();

  useEffect(() => {
    for (const chain of Object.values(evmChains)) {
      const rpcClient = createPublicClient({
        transport: http(chain.rpcBaseURL)
      });

      rpcClient.getChainId().then(chainId => {
        if (chainId !== chain.chainId) handleChainIdMissmatch(chain, chainId);
      });
    }
  }, [evmChains, handleChainIdMissmatch]);
};
