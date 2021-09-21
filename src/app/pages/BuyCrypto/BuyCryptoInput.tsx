import React, { ChangeEvent, FC } from "react";

import classNames from "clsx";
import useSWR from "swr";

import DropdownWrapper from "app/atoms/DropdownWrapper";
import Spinner from "app/atoms/Spinner";
import styles from "app/pages/BuyCrypto/BuyCrypto.module.css";
import CurrencyComponent from "app/pages/BuyCrypto/CurrencyComponent";
import { getCurrencies } from "lib/exolix-api";
import Popper from "lib/ui/Popper";

interface Props {
  type: string;
  coin: string;
  setCoin?: (coin: string) => void;
  minAmount?: string;
  onChangeInputHandler?: (value: ChangeEvent<HTMLInputElement>) => void;
  value?: number;
  amount?: number;
  lastMinAmount?: string;
  readOnly?: boolean;
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

const BuyCryptoInput: FC<Props> = ({
  type,
  coin,
  setCoin = () => void 0,
  minAmount,
  value,
  readOnly = false,
  amount,
  lastMinAmount,
  onChangeInputHandler,
}) => {
  const isCoinFromType = type === "coinFrom";
  const { data: currencies = [], isValidating: isCurrenciesLoaded } = useSWR(
    ["/api/currency"],
    getCurrencies
  );

  const filteredCurrencies = currencies.filter(
    (currency) => currency.status === 1 && coinList.includes(currency.code)
  );
  return (
    <>
      <div className={styles["titleWrapper"]}>
        <p className={styles["titleLeft"]}>{isCoinFromType ? "Send" : "Get"}</p>
        <p className={styles["titleRight"]}>
          {isCoinFromType ? (
            <>
              minimum amount: <span>{minAmount}</span> <span>{coin}</span>
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
      <p className={"absolute text-red-700 text-xs"}>
        {lastMinAmount !== undefined &&
          amount !== undefined &&
          amount !== 0 &&
          Number(lastMinAmount) > Number(amount) &&
          `Minimum amount: ${minAmount} ${coin}`}
      </p>
    </>
  );
};

export default BuyCryptoInput;
