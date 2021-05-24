import React, { memo, useMemo } from "react";

import BigNumber from "bignumber.js";
import classNames from "clsx";

import Money from "app/atoms/Money";
import { useAppEnv } from "app/env";
import InUSD from "app/templates/InUSD";
import {
  useAssets,
  TEZ_ASSET,
  getAssetKey,
  TempleAsset,
  TempleAssetType,
} from "lib/temple/front";

type MoneyDiffViewProps = {
  assetId: string;
  diff: string;
  pending?: boolean;
  className?: string;
};

const MoneyDiffView = memo<MoneyDiffViewProps>(
  ({ assetId, diff, pending = false, className }) => {
    const { popup } = useAppEnv();
    const { allAssetsWithHidden } = useAssets();
    const asset = useMemo(
      () =>
        assetId === "tez"
          ? TEZ_ASSET
          : allAssetsWithHidden.find((a) => getAssetKey(a) === assetId),
      [assetId, allAssetsWithHidden]
    );
    const diffBN = useMemo(
      () => new BigNumber(diff).div(asset ? 10 ** asset.decimals : 1),
      [diff, asset]
    );

    return (
      <div
        className={classNames(
          "inline-flex flex-wrap justify-end items-baseline",
          className
        )}
      >
        <div
          className={classNames(
            popup ? "text-xs" : "text-sm",
            pending
              ? "text-yellow-600"
              : diffBN.gt(0)
              ? "text-green-500"
              : "text-red-700"
          )}
        >
          {diffBN.gt(0) ? "+" : ""}
          <Money>{diffBN}</Money> {getAssetSymbol(asset)}
        </div>

        {asset && (
          <InUSD volume={diffBN.abs()} asset={asset}>
            {(usdVolume) => (
              <div className="text-xs text-gray-500 ml-1">
                <span className="mr-px">$</span>
                {usdVolume}
              </div>
            )}
          </InUSD>
        )}
      </div>
    );
  }
);

export default MoneyDiffView;

function getAssetSymbol(asset?: TempleAsset) {
  if (!asset) return "???";
  return asset.type === TempleAssetType.TEZ
    ? "ꜩ"
    : asset.symbol !== "???"
    ? asset.symbol
    : asset.name.substr(0, 5);
}
