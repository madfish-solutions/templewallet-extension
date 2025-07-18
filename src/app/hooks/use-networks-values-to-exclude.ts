import { useMemo } from 'react';

import { OneOfChains, useAllEvmChains, useAllTezosChains } from 'temple/front';

export const useNetworksValuesToExclude = (currentChain?: OneOfChains) => {
  const evmChains = useAllEvmChains();
  const tezChains = useAllTezosChains();

  return useMemo(() => {
    const result: Record<'rpcUrlsToExclude' | 'namesToExclude', string[]> = {
      rpcUrlsToExclude: [],
      namesToExclude: []
    };
    const populateResult = (chain: OneOfChains) => {
      if (currentChain?.chainId === chain.chainId) {
        return;
      }

      result.rpcUrlsToExclude.push(...chain.allRpcs.map(({ rpcBaseURL }) => rpcBaseURL));
      result.namesToExclude.push(chain.name);
    };

    for (const tezChainId in tezChains) {
      populateResult(tezChains[tezChainId]);
    }
    for (const evmChainId in evmChains) {
      populateResult(evmChains[evmChainId]);
    }

    return result;
  }, [currentChain?.chainId, evmChains, tezChains]);
};
