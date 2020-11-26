import * as React from "react";
import { browser } from "webextension-polyfill-ts";
import {
  XTZ_ASSET,
  MAINNET_TOKENS,
  useNetwork,
  useTokens,
  useStorage,
  useAllAssetsRef,
  useAccount,
} from "lib/thanos/front";
import { ThanosAsset, ThanosAssetType } from "../types";

export function assetsAreSame(asset1: ThanosAsset, asset2: ThanosAsset) {
  switch (asset1.type) {
    case ThanosAssetType.XTZ:
      return asset2.type === ThanosAssetType.XTZ;
    case ThanosAssetType.FA2:
      return asset2.type === ThanosAssetType.FA2 && (asset1.address === asset2.address) && (asset1.id === asset2.id);
    default:
      return asset2.type !== ThanosAssetType.XTZ && (asset1.address === asset2.address);
  }
}

type AssetData = {
  address?: string;
  tokenId?: number;
};

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

export function useCurrentAsset() {
  const { allAssets, defaultAsset } = useAssets();

  const network = useNetwork();
  const account = useAccount();
  const [assetData, setAssetData] = useStorage<AssetData>(
    `assetData_${network.id}_${account.publicKeyHash}`,
    {}
  );

  const currentAsset = React.useMemo(
    () => allAssets.find((a) => {
      if (!assetData.address) {
        return a.type === ThanosAssetType.XTZ;
      }
      return (a.type !== ThanosAssetType.XTZ) && (a.address === assetData.address) && ((a.type !== ThanosAssetType.FA2) || (a.id === assetData.tokenId));
    }) ?? defaultAsset,
    [allAssets, assetData, defaultAsset]
  );
  return {
    assetData,
    setAssetData,
    currentAsset,
  };
}

export function useSetAssetSymbol() {
  const network = useNetwork();
  const account = useAccount();

  const key = React.useMemo(
    () => `assetsymbol_${network.id}_${account.publicKeyHash}`,
    [network.id, account.publicKeyHash]
  );

  return React.useCallback(
    (symbol: string) => {
      browser.storage.local.set({ [key]: symbol });
    },
    [key]
  );
}
