import * as React from "react";
import classNames from "clsx";
import Carousel from "@brainhubeu/react-carousel";
import { useAssets, useCurrentAsset } from "lib/thanos/front";
import { getAssetIconUrl } from "app/defaults";
import Balance from "app/templates/Balance";
import InUSD from "app/templates/InUSD";
import Name from "app/atoms/Name";
import Money from "app/atoms/Money";
import styles from "./Assets.module.css";

type AssetsProps = {
  accountPkh: string;
  className?: string;
};

const Assets: React.FC<AssetsProps> = ({ accountPkh, className }) => {
  const { allAssets, defaultAsset } = useAssets();
  const { currentAsset, setAssetSymbol } = useCurrentAsset();

  const initialLocalAssetIndex = React.useMemo(() => {
    const i = allAssets.findIndex((a) => currentAsset.symbol === a.symbol);
    return i === -1 ? 0 : i;
  }, [allAssets, currentAsset]);
  const [localAssetIndex, setLocalAssetIndex] = React.useState(
    initialLocalAssetIndex
  );

  const handleCarouselChange = React.useCallback(
    (i: number) => {
      const index = i % allAssets.length;
      const symbol =
        allAssets[index >= 0 ? index : allAssets.length + index]?.symbol ??
        defaultAsset.symbol;

      setLocalAssetIndex(i);
      setAssetSymbol(symbol);
    },
    [setLocalAssetIndex, setAssetSymbol, allAssets, defaultAsset]
  );

  const slides = React.useMemo(
    () =>
      allAssets.map((asset, i) => (
        <div className="p-2 flex flex-col items-center justify-around">
          <img
            src={getAssetIconUrl(asset)}
            alt={asset.name}
            className={classNames(i === 0 ? "w-16 h-16" : "w-12 h-12")}
            style={{ minHeight: i === 0 ? "4rem" : "3rem" }}
          />

          {i !== 0 && (
            <Name
              className={classNames(
                "mt-1 w-16",
                "text-center",
                "text-xs text-gray-600 font-medium leading-none"
              )}
            >
              {asset.name}
            </Name>
          )}
        </div>
      )),
    [allAssets]
  );

  const carousel = React.useMemo(
    () =>
      slides.length > 1 ? (
        <Carousel
          value={localAssetIndex}
          slides={slides}
          onChange={handleCarouselChange}
          slidesPerPage={2}
          centered
          arrows
          infinite
          clickToChange
          draggable={false}
        />
      ) : (
        slides[0]
      ),
    [slides, localAssetIndex, handleCarouselChange]
  );

  return (
    <div className={classNames("flex flex-col items-center", className)}>
      <div className={classNames("w-64 mb-2", styles["carousel-container"])}>
        {carousel}
      </div>

      <Balance address={accountPkh} asset={currentAsset}>
        {(balance) => (
          <div className="flex flex-col items-center">
            <div className="text-gray-800 text-2xl font-light">
              <Money>{balance}</Money>{" "}
              <span className="text-lg opacity-90">{currentAsset.symbol}</span>
            </div>

            <InUSD volume={balance} asset={currentAsset}>
              {(usdBalance) => (
                <div className="text-gray-600 text-lg font-light">
                  <span className="mr-px">$</span>
                  {usdBalance} <span className="text-sm opacity-75">USD</span>
                </div>
              )}
            </InUSD>
          </div>
        )}
      </Balance>
    </div>
  );
};

export default Assets;
