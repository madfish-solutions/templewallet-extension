import React, { ChangeEvent, FC } from "react";

import { Modifier } from "@popperjs/core";
import BigNumber from "bignumber.js";
import classNames from "clsx";
import useSWR from "swr";

import DropdownWrapper from "app/atoms/DropdownWrapper";
import Spinner from "app/atoms/Spinner";
import styles from "app/pages/BuyCrypto/BuyCrypto.module.css";
import CurrencyComponent from "app/pages/BuyCrypto/CurrencyComponent";
import { getCurrencies, getRateDataInterface } from "lib/exolix-api";
import { T } from "lib/i18n/react";
import Popper from "lib/ui/Popper";

interface Props {
  type: string;
  coin: string;
  setCoin?: (coin: string) => void;
  onChangeInputHandler?: (value: ChangeEvent<HTMLInputElement>) => void;
  value?: number;
  amount?: number;
  lastMinAmount?: BigNumber;
  readOnly?: boolean;
  rates?: getRateDataInterface;
  maxAmount?: string;
  isMaxAmountError?: boolean;
}

const numbersAndDotRegExp = /^[0-9]*\.?[0-9]*$/;

const coinList = [
  "BTC",
  "LTC",
  "DOGE",
  "XMR",
  "ETH",
  "AR",
  "SOL",
  "MATIC",
  "DOT",
  "KSM",
  "USDT",
  "UNI",
  "1INCH",
  "CRV",
  "COMP",
  "MKR",
  "RENBTC",
  "YFI",
  "LINK",
  "SHIB",
  "XVS",
  "CAKE",
  "QUICK",
  "LUNA",
  "ATOM",
  "SUSHI",
];

const sameWidth: Modifier<string, any> = {
  name: "sameWidth",
  enabled: true,
  phase: "beforeWrite",
  requires: ["computeStyles"],
  fn: ({ state }) => {
    state.styles.popper.width = `${state.rects.reference.width + 17}px`;
    // state.styles.popper.left = "-5px";
  },
  effect: ({ state }) => {
    state.elements.popper.style.width = `${
      (state.elements.reference as any).offsetWidth + 15
    }px`;
    return () => {};
  },
};

const BuyCryptoInput: FC<Props> = ({
  type,
  coin,
  setCoin = () => void 0,
  value,
  readOnly = false,
  amount,
  lastMinAmount,
  onChangeInputHandler,
  rates = { destination_amount: 0, rate: 0, min_amount: "0" },
  maxAmount,
  isMaxAmountError,
}) => {
  const isCoinFromType = type === "coinFrom";
  const { data: currencies = [], isValidating: isCurrenciesLoaded } = useSWR(
    ["/api/currency"],
    getCurrencies
  );

  const isMinAmountError =
    amount !== 0 &&
    (lastMinAmount ? lastMinAmount.toNumber() : 0) > Number(amount);

  const filteredCurrencies = currencies.filter(
    (currency) => currency.status === 1 && coinList.includes(currency.code)
  );
  return (
    <>
      <div className={styles["titleWrapper"]}>
        <p className={styles["titleLeft"]}>{isCoinFromType ? "Send" : "Get"}</p>
        <p
          className={classNames(
            isMinAmountError ? "text-red-700" : "text-gray-500"
          )}
        >
          {isCoinFromType ? (
            <>
              <T id={"min"}></T>
              <span
                className={classNames(
                  isMinAmountError ? "text-red-700" : "text-gray-700",
                  "text-sm"
                )}
              >
                {" "}
                {rates!.min_amount}
              </span>{" "}
              <span
                className={classNames(
                  isMinAmountError ? "text-red-700" : "text-gray-700",
                  "text-xs"
                )}
              >
                {coin}
              </span>
            </>
          ) : null}
        </p>
      </div>
      <div className={styles["inputWrapper"]}>
        <div className={styles["currencyBlock"]}>
          {isCoinFromType ? (
            <Popper
              placement="bottom"
              strategy="fixed"
              modifiers={[sameWidth]}
              fallbackPlacementsEnabled={false}
              popup={({ opened, setOpened }) => (
                <DropdownWrapper
                  opened={opened}
                  className="origin-top overflow-x-hidden overflow-y-auto"
                  style={{
                    maxHeight: "15.75rem",
                    backgroundColor: "white",
                    borderColor: "#e2e8f0",
                    padding: 0,
                  }}
                >
                  {isCurrenciesLoaded ? (
                    <Spinner theme="primary" style={{ width: "3rem" }} />
                  ) : (
                    filteredCurrencies.map((currency) => (
                      <CurrencyComponent
                        type="currencyDropdown"
                        key={currency.code}
                        label={currency.code}
                        onPress={() => {
                          setCoin(currency.code);
                          setOpened(false);
                        }}
                      />
                    ))
                  )}
                </DropdownWrapper>
              )}
            >
              {({ ref, opened, toggleOpened, setOpened }) => (
                <CurrencyComponent
                  type="currencySelector"
                  label={coin}
                  ref={ref as unknown as React.RefObject<HTMLDivElement>}
                  onPress={toggleOpened}
                />
              )}
            </Popper>
          ) : (
            <CurrencyComponent type="tezosSelector" label={coin} />
          )}
        </div>
        <div className={styles["amountInputContainer"]}>
          <input
            readOnly={readOnly}
            onKeyPress={(event: React.KeyboardEvent<HTMLInputElement>) => {
              const value = (event.target as unknown as HTMLInputElement).value;
              if (
                value.indexOf("0") !== -1 &&
                value.length === 1 &&
                event.key === "0"
              ) {
                event.preventDefault();
              }
              if (value.indexOf(".") !== -1 && event.key === ".") {
                event.preventDefault();
              }
              if (!numbersAndDotRegExp.test(event.key)) {
                event.preventDefault();
              }
            }}
            value={value}
            placeholder="0.00"
            className={classNames([[styles["amountInput"], "pr-1"]])}
            type="text"
            maxLength={15}
            onChange={onChangeInputHandler}
          />
        </div>
      </div>
      <div
        className={styles["titleWrapper"]}
        style={{ justifyContent: "flex-end" }}
      >
        <p
          className={classNames(
            isMaxAmountError ? "text-red-700" : "text-gray-500"
          )}
        >
          {isCoinFromType ? (
            <>
              <T id={"max"}></T>:
              <span
                className={classNames(
                  isMaxAmountError ? "text-red-700" : "text-gray-700",
                  "text-sm"
                )}
              >
                {" "}
                {maxAmount !== "Infinity" ? maxAmount : "0"}
              </span>{" "}
              <span
                className={classNames(
                  isMaxAmountError ? "text-red-700" : "text-gray-700",
                  "text-xs"
                )}
              >
                {coin}
              </span>
            </>
          ) : null}
        </p>
      </div>
    </>
  );
};

export default BuyCryptoInput;
