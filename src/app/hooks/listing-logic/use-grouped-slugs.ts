import { useMemo } from 'react';

import { groupBy } from 'lodash';

import { fromChainAssetSlug } from 'lib/assets/utils';
import { EvmChain, TezosChain, useAllEvmChains, useAllTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

export const useGroupedSlugs = (groupByNetwork: boolean, manageActive: boolean, searchedEnabledSlugs: string[]) => {
  const tezosChains = useAllTezosChains();
  const evmChains = useAllEvmChains();

  return useMemo(() => {
    if (!groupByNetwork || manageActive) return searchedEnabledSlugs;

    const chainNameSlugsRecord = groupBy(searchedEnabledSlugs, chainSlug => {
      const [chainKind, chainId] = fromChainAssetSlug(chainSlug);

      return getChainName(
        chainKind === TempleChainKind.Tezos ? tezosChains[chainId as string] : evmChains[chainId as number]
      );
    });

    return Object.keys(chainNameSlugsRecord).reduce<string[]>(
      (acc, key) => acc.concat(key, chainNameSlugsRecord[key]),
      []
    );
  }, [evmChains, groupByNetwork, manageActive, searchedEnabledSlugs, tezosChains]);
};

const getChainName = (chain?: TezosChain | EvmChain) => chain?.name ?? 'Unknown chain';
