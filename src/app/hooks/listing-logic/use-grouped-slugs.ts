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

export const useChainsSlugsGrouping = <T extends string | number>(chainsSlugs: string[], active: boolean) =>
  useMemo(() => {
    if (!active) return null;

    const result = new Map<T, string[]>();

    for (const chainSlug of chainsSlugs) {
      const [, chainId] = fromChainAssetSlug<T>(chainSlug);

      const slugs = result.get(chainId) ?? [];
      if (!result.has(chainId)) result.set(chainId, slugs);

      slugs.push(chainSlug);
    }

    return Array.from(result.entries());
  }, [chainsSlugs, active]);
