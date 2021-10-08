import React, { forwardRef } from "react";

import classNames from "clsx";
import { browser } from "webextension-polyfill-ts";

import { ReactComponent as ChevronDownIcon } from "app/icons/chevron-down.svg";
import styles from "app/pages/BuyCrypto/BuyCrypto.module.css";
import AssetIcon from "app/templates/AssetIcon";

interface Props {
  onPress?: () => void;
  label: string;
  type?: string;
}

const customLogoCurrencyList = [
  "QUICK",
  "1INCH",
  "DOGE",
  "CAKE",
  "SUSHI",
  "SHIB",
];

const CurrencyComponent = forwardRef<HTMLDivElement, Props>(
  ({ onPress, label, type }, ref) => {
    return (
      <div
        style={
          type === "currencySelector"
            ? undefined
            : { margin: "5px 0", justifyContent: "start", paddingLeft: "5px" }
        }
        onClick={onPress}
        ref={ref}
        className={classNames(styles["currencySelector"], "cursor-pointer")}
      >
        {type === "tezosSelector" ? (
          <AssetIcon assetSlug="tez" size={32} />
        ) : (
          <>
            {customLogoCurrencyList.indexOf(label) === -1 ? (
              <img
                alt="icon"
                className={styles["currencyCircle"]}
                src={browser.runtime.getURL(
                  "misc/token-logos/top-up-token-logos/" +
                    label.toLowerCase() +
                    ".png"
                )}
              />
            ) : (
              <div className={styles["customCurrencyCircleWrapper"]}>
                <img
                  alt="icon"
                  className={styles["customCurrencyCircle"]}
                  src={browser.runtime.getURL(
                    "misc/token-logos/top-up-token-logos/" +
                      label.toLowerCase() +
                      ".png"
                  )}
                />
              </div>
            )}
          </>
        )}
        <p className={styles["currencyName"]}>{label}</p>
        {type === "currencySelector" && (
          <ChevronDownIcon className="w-4 h-auto text-gray-700 stroke-current stroke-2" />
        )}
      </div>
    );
  }
);

export default CurrencyComponent;
