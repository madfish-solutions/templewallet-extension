import React, { FC } from "react";

import classNames from "clsx";

import Money from "app/atoms/Money";
import Name from "app/atoms/Name";
import AssetIcon from "app/templates/AssetIcon";
import Balance from "app/templates/Balance";
import InUSD from "app/templates/InUSD";
import { TempleAsset } from "lib/temple/front";

type MainAssetBannerProps = {
  asset: TempleAsset;
  accountPkh: string;
  className?: string;
};

const MainAssetBanner: FC<MainAssetBannerProps> = ({
  asset,
  accountPkh,
  className,
}) => {
  return (
    <div
      className={classNames(
        "w-full mx-auto",
        "pt-1",
        "flex flex-col items-center",
        className
      )}
      style={{ maxWidth: "19rem" }}
    >
      <div
        className={classNames(
          "relative",
          "w-full",
          "border rounded-md",
          "p-2",
          "flex items-center"
        )}
      >
        <div
          className={classNames(
            "absolute top-0 left-0 right-0",
            "flex justify-center"
          )}
        >
          <div
            className={classNames(
              "-mt-3 py-1 px-2",
              "bg-white rounded-full",
              "text-sm font-light leading-none text-center",
              "text-gray-500"
            )}
          >
            <Name style={{ maxWidth: "13rem" }}>{asset.name}</Name>
          </div>
        </div>

        <AssetIcon asset={asset} size={48} className="mr-3 flex-shrink-0" />

        <div className="font-light leading-none">
          <div className="flex items-center">
            <Balance address={accountPkh} asset={asset}>
              {(balance) => (
                <div className="flex flex-col">
                  <span className="text-xl text-gray-700">
                    <Money>{balance}</Money>{" "}
                    <span className="text-lg opacity-90">{asset.symbol}</span>
                  </span>

                  <InUSD asset={asset} volume={balance}>
                    {(usdBalance) => (
                      <div className="mt-1 text-sm text-gray-500">
                        ${usdBalance}
                      </div>
                    )}
                  </InUSD>
                </div>
              )}
            </Balance>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainAssetBanner;
