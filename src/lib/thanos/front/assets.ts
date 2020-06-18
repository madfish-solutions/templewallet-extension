import * as React from "react";
import {
  XTZ_ASSET,
  MAINNET_TOKENS,
  useNetwork,
  useTokens,
  usePassiveStorage,
} from "lib/thanos/front";

export function useAssets() {
  const network = useNetwork();
  const { tokens } = useTokens();

  const allAssets = React.useMemo(
    () => [
      XTZ_ASSET,
      ...(network.type === "main" ? MAINNET_TOKENS : []),
      ...tokens,
    ],
    [network.type, tokens]
  );
  const defaultAsset = React.useMemo(() => allAssets[0], [allAssets]);

  return { allAssets, defaultAsset };
}

export function useCurrentAsset() {
  const { allAssets, defaultAsset } = useAssets();

  const network = useNetwork();
  const [assetSymbol, setAssetSymbol] = usePassiveStorage(
    `assetsymbol_${network.id}`,
    defaultAsset.symbol
  );

  const currentAsset = React.useMemo(
    () => allAssets.find((a) => a.symbol === assetSymbol) ?? defaultAsset,
    [allAssets, assetSymbol, defaultAsset]
  );

  return {
    assetSymbol,
    setAssetSymbol,
    currentAsset,
  };
}
