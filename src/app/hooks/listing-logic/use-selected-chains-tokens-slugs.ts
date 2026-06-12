import { parseChainAssetSlug } from 'lib/assets/utils';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { useTokensManageState, useTokensSelectedChainsState } from '../use-assets-view-state';

export const useSelectedChainsTokensSlugs = <T extends TempleChainKind = TempleChainKind>(
  allSlugsSorted: string[],
  allSlugsSortedGrouped: ChainGroupedSlugs<T> | null
) => {
  const { selectedChains } = useTokensSelectedChainsState();
  const { manageActive } = useTokensManageState();
  const selectedChainsSlugsSorted =
    selectedChains.length === 0 || manageActive
      ? allSlugsSorted
      : allSlugsSorted.filter(slug => selectedChains.includes(parseChainAssetSlug(slug)[1]));
  const selectedChainsSlugsSortedGrouped =
    selectedChains.length === 0 || manageActive || !allSlugsSortedGrouped
      ? allSlugsSortedGrouped
      : allSlugsSortedGrouped.filter(([chainId]) => selectedChains.includes(chainId));

  return { selectedChainsSlugsSorted, selectedChainsSlugsSortedGrouped };
};
