import React, { FC } from "react";

import { T } from "lib/i18n/react";

interface Props {
  currency: string;
}

const getTranslationId = (currency: string) => {
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

const WarningComponent: FC<Props> = ({ currency }) => {

  return (
    <>
      {getTranslationId(currency) && (
        <div
          className={
            "py-2 px-4 rounded-lg border border-orange-500 mt-10 mb-16"
          }
        >
          <p className={"text-red-700 text-xs"}>
            <T id={getTranslationId(currency)!} />
          </p>
        </div>
      )}
    </>
  );
};

export default WarningComponent;
