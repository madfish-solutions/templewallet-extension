import { isTezAsset } from 'lib/assets';
import { TEZOS_METADATA } from 'lib/metadata/defaults';
import type { AssetMetadataBase } from 'lib/metadata/types';
import { searchAndFilterItems } from 'lib/utils/search-items';

import { fromAssetSlug } from './utils';

export function searchAssetsWithNoMeta<T>(
  searchValue: string,
  assets: T[],
  getMetadata: (slug: string) => AssetMetadataBase | undefined,
  getSlug: (asset: T) => string
) {
  const trimmedSearchValue = searchValue.trim();

  if (trimmedSearchValue.search(/^[A-Za-z0-9]+_\d*$/) === 0)
    return assets.filter(asset => getSlug(asset).startsWith(trimmedSearchValue));

  return searchAndFilterItems(
    assets,
    searchValue,
    Number.isInteger(Number(searchValue))
      ? [
          { name: 'tokenId', weight: 1 },
          { name: 'symbol', weight: 0.75 },
          { name: 'name', weight: 0.5 }
        ]
      : [
          { name: 'symbol', weight: 1 },
          { name: 'name', weight: 0.5 },
          { name: 'contract', weight: 0.1 }
        ],
    asset => {
      const slug = getSlug(asset);
      const [contract, tokenId] = fromAssetSlug(slug);
      const metadata = isTezAsset(slug) ? TEZOS_METADATA : getMetadata(slug);

      return {
        contract,
        tokenId,
        symbol: metadata?.symbol,
        name: metadata?.name
      };
    }
  );
}
