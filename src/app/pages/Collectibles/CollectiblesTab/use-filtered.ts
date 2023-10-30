import { useCallback, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { useDebounce } from 'use-debounce';

import { toTokenSlug } from 'lib/assets';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useAssetsSortPredicate } from 'lib/assets/use-filtered';
import { useAccountBalances } from 'lib/balances';
import { useTokensMetadataWithPresenceCheck } from 'lib/metadata';

export function useFilteredAssetsSlugs(assetsSlugs: string[], filterZeroBalances = false) {
  const allTokensMetadata = useTokensMetadataWithPresenceCheck(assetsSlugs);

  const balances = useAccountBalances();
  const isNonZeroBalance = useCallback(
    (slug: string) => {
      const balance = balances[slug];
      return isDefined(balance) && balance !== '0';
    },
    [balances]
  );

  const sourceArray = useMemo(
    () => (filterZeroBalances ? assetsSlugs.filter(isNonZeroBalance) : assetsSlugs),
    [filterZeroBalances, assetsSlugs, isNonZeroBalance]
  );

  const [searchValue, setSearchValue] = useState('');
  const [tokenId, setTokenId] = useState<number>();
  const [searchValueDebounced] = useDebounce(tokenId ? toTokenSlug(searchValue, tokenId) : searchValue, 300);

  const assetsSortPredicate = useAssetsSortPredicate();

  const filteredAssets = useMemo(
    () =>
      searchAssetsWithNoMeta(searchValueDebounced, sourceArray, allTokensMetadata, slug => slug).sort(
        assetsSortPredicate
      ),
    [searchValueDebounced, sourceArray, allTokensMetadata, assetsSortPredicate]
  );

  return {
    filteredAssets,
    searchValue,
    setSearchValue,
    tokenId,
    setTokenId
  };
}
