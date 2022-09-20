import { useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { searchAssets, useAllTokensBaseMetadata } from 'lib/temple/front';
import { IAccountToken } from 'lib/temple/repo';

export function useFilteredAssetsList(assets: IAccountToken[]) {
  const allTokensBaseMetadata = useAllTokensBaseMetadata();

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const assetSlugs = useMemo(() => assets.map(asset => asset.tokenSlug), [assets]);

  const filteredAssets = useMemo(
    () => searchAssets(searchValueDebounced, assetSlugs, allTokensBaseMetadata),
    [searchValueDebounced, assetSlugs, allTokensBaseMetadata]
  );

  return {
    filteredAssets,
    searchValue,
    setSearchValue
  };
}
