import * as React from "react";
import {
  XTZ_ASSET,
  useTokens,
  useAllAssetsRef,
  getAssetKey,
} from "lib/thanos/front";

export function useAssets() {
  const { displayedTokens } = useTokens();
  const allAssetsRef = useAllAssetsRef();

  const allAssets = React.useMemo(() => [XTZ_ASSET, ...displayedTokens], [
    displayedTokens,
  ]);

  React.useEffect(() => {
    allAssetsRef.current = allAssets;
  }, [allAssetsRef, allAssets]);

  const defaultAsset = React.useMemo(() => allAssets[0], [allAssets]);

  return { allAssets, defaultAsset };
}

export function useAssetBySlug(slug?: string | null) {
  const { allAssets } = useAssets();
  const asset = React.useMemo(
    () => allAssets.find((a) => getAssetKey(a) === slug) ?? null,
    [allAssets, slug]
  );
  return React.useMemo(() => asset, [asset]);
}
