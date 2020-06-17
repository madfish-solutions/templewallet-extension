import * as React from "react";
import classNames from "clsx";
import Carousel from "@brainhubeu/react-carousel";
import { usePassiveStorage } from "lib/thanos/front";
import Balance from "app/templates/Balance";
import InUSD from "app/templates/InUSD";
import Name from "app/atoms/Name";
import Money from "app/atoms/Money";
import xtzImgUrl from "app/misc/xtz.png";
import styles from "./Assets.module.css";

type AssetsProps = {
  accountPkh: string;
  className?: string;
};

const Assets: React.FC<AssetsProps> = ({ accountPkh, className }) => {
  const assets = React.useMemo(
    () => [
      {
        src: xtzImgUrl,
        alt: "XTZ",
      },
      {
        src:
          "https://tezblock.io/assets/bakers/img/KT1EctCuorV2NfVb1XTQgvzJ88MQtWP8cMMv.png",
        alt: "Staker",
      },
      {
        src:
          "https://tezblock.io/assets/bakers/img/KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn.png",
        alt: "tzBTC",
      },
      {
        src:
          "https://tezblock.io/assets/bakers/img/KT1LN4LPSqTMS7Sd2CJw4bbDGRkMv2t68Fy9.png",
        alt: "USD Tez",
      },
    ],
    []
  );

  const [assetIndex, setAssetIndex] = usePassiveStorage("__debug_kek", 0);
  const [localAssetIndex, setLocalAssetIndex] = React.useState(assetIndex);

  React.useEffect(() => {
    if (localAssetIndex !== assetIndex) {
      setAssetIndex(localAssetIndex % assets.length);
    }
  }, [localAssetIndex, assetIndex, setAssetIndex, assets.length]);

  const slides = React.useMemo(
    () =>
      assets.map(({ src, alt }, i) => (
        <div className="p-2 flex flex-col items-center justify-around">
          <img
            src={src}
            alt={alt}
            className={classNames(i === 0 ? "w-16 h-16" : "w-12 h-12")}
            style={{ minHeight: i === 0 ? "4rem" : "3rem" }}
          />

          {i !== 0 && (
            <Name
              className={classNames(
                "mt-1 w-16",
                "text-center",
                "text-sm text-gray-600 font-medium"
              )}
            >
              {alt}
            </Name>
          )}
        </div>
      )),
    [assets]
  );

  return (
    <div className={classNames("flex flex-col items-center", className)}>
      <div className={classNames("w-64 mb-2", styles["carousel-container"])}>
        {assets.length > 1 ? (
          <Carousel
            value={localAssetIndex}
            slides={slides}
            onChange={setLocalAssetIndex}
            slidesPerPage={2}
            centered
            arrows
            infinite
            clickToChange
            draggable={false}
          />
        ) : (
          slides[0]
        )}
      </div>

      {/* <img src={xtzImgUrl} alt="xtz" className="mb-2 h-16 w-auto" /> */}

      <Balance address={accountPkh}>
        {(balance) => (
          <div className="flex flex-col items-center">
            <div className="text-gray-800 text-2xl font-light">
              <Money>{balance}</Money>{" "}
              <span className="text-lg opacity-90">XTZ</span>
            </div>

            <InUSD volume={balance}>
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
