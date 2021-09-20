import React, { FC } from "react";

import classNames from "clsx";

import { T } from "lib/i18n/react";

interface Props {
  currency?: string;
  amountAttention?: boolean;
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

const WarningComponent: FC<Props> = ({ currency, amountAttention }) => {
  return (
    <>
      {(getTranslationId(currency!) || amountAttention) && (
        <div
          className={classNames(
            "py-2 px-4 rounded-lg border border-orange-500",
            currency && "mt-10 mb-16",
            amountAttention && "mt-8"
          )}
        >
          <p className={"text-orange-500 text-xs"}>
            {currency && <T id={getTranslationId(currency)!} />}

            {amountAttention && (
              <>
                <span className="text-base block pb-2 pt-2">
                  <T id={"important"} />
                </span>
                <T
                  id={"attentionSendAmount"}
                  substitutions={[
                    <a
                      href={"https://exolix.com/contact"}
                      className="underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <T id={"support"} />
                    </a>,
                  ]}
                />
              </>
            )}
          </p>
        </div>
      )}
    </>
  );
};

export default WarningComponent;
