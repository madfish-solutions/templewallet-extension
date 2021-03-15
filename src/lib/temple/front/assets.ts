import * as React from "react";
import {
  TEZ_ASSET,
  useTokens,
  useAllAssetsRef,
  getAssetKey,
  TempleAsset,
} from "lib/temple/front";

export function useAssets() {
  const { allTokens, displayedTokens } = useTokens();
  const allAssetsRef = useAllAssetsRef();

  const allAssets = React.useMemo(() => [TEZ_ASSET, ...displayedTokens], [
    displayedTokens,
  ]);
  const allAssetsWithHidden = React.useMemo(() => [TEZ_ASSET, ...allTokens], [
    allTokens,
  ]);

  React.useEffect(() => {
    allAssetsRef.current = allAssets;
  }, [allAssetsRef, allAssets]);

  const defaultAsset = React.useMemo(() => allAssets[0], [allAssets]);

  return { allAssets, allAssetsWithHidden, defaultAsset };
}

export function useAssetBySlug(slug?: string | null) {
  const { allAssets } = useAssets();
  const asset = React.useMemo(
    () => allAssets.find((a) => getAssetKey(a) === slug) ?? null,
    [allAssets, slug]
  );
  return React.useMemo(() => asset, [asset]);
}

export const ASSET_FIELDS_TO_SEARCH = ["symbol", "name", "address"];

export function searchAssets<T extends TempleAsset>(
  assets: T[],
  searchValue: string
) {
  if (!searchValue) return assets;

  const loweredSearchValue = searchValue.toLowerCase();
  return assets.filter((a) =>
    ASSET_FIELDS_TO_SEARCH.some((field) =>
      (a as any)[field]?.toLowerCase().includes(loweredSearchValue)
    )
  );
}
