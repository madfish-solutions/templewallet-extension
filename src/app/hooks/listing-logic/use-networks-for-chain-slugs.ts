import { parseChainAssetSlug } from 'lib/assets/utils';
import { OneOfChains, useAllEvmChains, useAllTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

export const useNetworksForChainSlugs = (chainSlugs: string[]) => {
  const tezosChains = useAllTezosChains();
  const evmChains = useAllEvmChains();

  return Object.values(
    chainSlugs.reduce<Record<string, OneOfChains>>((acc, chainSlug) => {
      const [chainKind, chainId] = parseChainAssetSlug(chainSlug);
      if (chainKind === TempleChainKind.Tezos) {
        acc[chainId] = tezosChains[chainId];
      } else if (chainKind === TempleChainKind.EVM) {
        acc[chainId] = evmChains[chainId];
      }

      return acc;
    }, {})
  );
};
