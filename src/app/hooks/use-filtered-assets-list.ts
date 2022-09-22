import { useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import Fuse from 'fuse.js';
import { useDebounce } from 'use-debounce';

import { AssetMetadata, isTezAsset, TEZOS_METADATA, useAllTokensBaseMetadata } from 'lib/temple/front';

interface filteredAssetInterface {
  slug: string;
  latestBalance: BigNumber;
}

export function useFilteredAssetsList(assets: filteredAssetInterface[]) {
  const allTokensBaseMetadata = useAllTokensBaseMetadata();

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const filteredAssets = useMemo(
    () => filterAssets(searchValueDebounced, assets, allTokensBaseMetadata),
    [searchValueDebounced, assets, allTokensBaseMetadata]
  );

  return {
    filteredAssets,
    searchValue,
    setSearchValue
  };
}

const filterAssets = (
  searchValue: string,
  assets: filteredAssetInterface[],
  allTokensBaseMetadata: Record<string, AssetMetadata>
) => {
  if (!searchValue) return assets;

  const fuse = new Fuse(
    assets.map(({ slug, latestBalance }) => ({
      slug,
      latestBalance,
      metadata: isTezAsset(slug) ? TEZOS_METADATA : allTokensBaseMetadata[slug]
    })),
    {
      keys: [
        { name: 'metadata.name', weight: 0.9 },
        { name: 'metadata.symbol', weight: 0.7 },
        { name: 'slug', weight: 0.3 }
      ],
      threshold: 1
    }
  );

  return fuse.search(searchValue).map(({ item: { slug, latestBalance } }) => ({ slug, latestBalance }));
};
