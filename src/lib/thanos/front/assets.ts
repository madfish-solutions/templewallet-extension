import * as React from "react";
import {
  XTZ_ASSET,
  MAINNET_TOKENS,
  useNetwork,
  useTokens,
  useAllAssetsRef,
} from "lib/thanos/front";
import { ThanosAsset, ThanosAssetType } from "../types";

export function assetsAreSame(aAsset: ThanosAsset, bAsset: ThanosAsset) {
  return getAssetKey(aAsset) === getAssetKey(bAsset);
}

export function useAssets() {
  const network = useNetwork();
  const { tokens } = useTokens();
  const allAssetsRef = useAllAssetsRef();

  const allAssets = React.useMemo(
    () => [
      XTZ_ASSET,
      ...(network.type === "main" ? MAINNET_TOKENS : []),
      ...tokens,
    ],
    [network.type, tokens]
  );

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

export function getAssetKey(asset: ThanosAsset) {
  switch (asset.type) {
    case ThanosAssetType.XTZ:
      return "xtz";

    case ThanosAssetType.FA2:
      return `${asset.address}_${asset.id}`;

    default:
      return `${asset.address}_0`;
  }
}
