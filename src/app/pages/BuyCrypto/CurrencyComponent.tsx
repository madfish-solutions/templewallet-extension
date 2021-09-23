import React, { forwardRef } from "react";

import { browser } from "webextension-polyfill-ts";

import { ReactComponent as ChevronDownIcon } from "app/icons/chevron-down.svg";
import styles from "app/pages/BuyCrypto/BuyCrypto.module.css";
import AssetIcon from "app/templates/AssetIcon";

interface Props {
  onPress?: () => void;
  label: string;
  type?: string;
}

const CurrencyComponent = forwardRef<HTMLDivElement, Props>(
  ({ onPress, label, type }, ref) => {
    return (
      <div
        style={
          type === "currencySelector"
            ? undefined
            : { margin: "5px 0", justifyContent: "start", paddingLeft: "10px" }
        }
        onClick={onPress}
        ref={ref}
        className={styles["currencySelector"]}
      >
        {type === "tezosSelector" ? (
          <AssetIcon assetSlug="tez" size={32} />
        ) : (
          <img
            alt="icon"
            className={styles["currencyCircle"]}
            src={browser.runtime.getURL(
              "misc/token-logos/top-up-token-logos/" +
                label.toLowerCase() +
                ".png"
            )}
          />
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
