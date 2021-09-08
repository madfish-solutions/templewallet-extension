import React, { FC } from "react";

import { T } from "lib/i18n/react";

interface Props {
  currency: string;
}

const WarningComponent: FC<Props> = ({ currency }) => {
  const getTranslationId = () => {
    if (currency === "DOGE") {
      return "dogeNote";
    }
    if (currency === "MATIC") {
      return "polygonNote";
    }
    if (currency === "USDT") {
      return "usdtNote";
    }
    if (currency === "CAKE") {
      return "cakeNote";
    }
    return;
  };

  return (
    <>
      {getTranslationId() && (
        <div
          className={
            "py-2 px-4 rounded-lg border border-orange-500 mt-10 mb-16"
          }
        >
          <p className={"text-red-700 text-xs"}>
            <T id={getTranslationId()!} />
          </p>
        </div>
      )}
    </>
  );
};

export default WarningComponent;
