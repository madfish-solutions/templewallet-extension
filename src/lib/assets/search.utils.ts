import { isTezAsset } from 'lib/assets';
import { TEZOS_METADATA } from 'lib/metadata/defaults';
import type { AssetMetadataBase } from 'lib/metadata/types';
import { searchAndFilterItems } from 'lib/utils/search-items';

export function searchAssetsWithNoMeta<T>(
  searchValue: string,
  assets: T[],
  tokensMetadata: Record<string, AssetMetadataBase>,
  getSlug: (asset: T) => string
) {
  return searchAndFilterItems(
    assets,
    searchValue,
    [
      { name: 'metadata.symbol', weight: 1 },
      { name: 'metadata.name', weight: 0.25 },
      { name: 'slug', weight: 0.1 }
    ],
    asset => {
      const slug = getSlug(asset);
      return {
        slug,
        metadata: isTezAsset(slug) ? TEZOS_METADATA : tokensMetadata[slug]
      };
    }
  );
}
