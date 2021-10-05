import React, { ChangeEvent, FC, useEffect, useState } from "react";

import BigNumber from "bignumber.js";
import useSWR from "swr";
import { useDebounce } from "use-debounce";

import Divider from "app/atoms/Divider";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import styles from "app/pages/BuyCrypto/BuyCrypto.module.css";
import BuyCryptoInput from "app/pages/BuyCrypto/BuyCryptoInput";
import ErrorComponent from "app/pages/BuyCrypto/steps/ErrorComponent";
import WarningComponent from "app/pages/BuyCrypto/steps/WarningComponent";
import {
  ExchangeDataInterface,
  ExchangeDataStatusEnum,
  getRate,
  submitExchange,
} from "lib/exolix-api";
import { T } from "lib/i18n/react";
import { useAccount, useAssetUSDPrice } from "lib/temple/front";

const coinTo = "XTZ";
const maxDollarValue = 5000;
const avgCommission = 300;

interface Props {
  exchangeData: ExchangeDataInterface | null;
  setExchangeData: (exchangeData: ExchangeDataInterface | null) => void;
  setStep: (step: number) => void;
  isError: boolean;
  setIsError: (error: boolean) => void;
}

const InitialStep: FC<Props> = ({
  exchangeData,
  setExchangeData,
  setStep,
  isError,
  setIsError,
}) => {
  const [maxAmount, setMaxAmount] = useState("");
  const [amount, setAmount] = useState(0);
  const [coinFrom, setCoinFrom] = useState("BTC");
  const [lastMinAmount, setLastMinAmount] = useState(new BigNumber(0));
  const [lastMaxAmount, setLastMaxAmount] = useState("0");

  const [depositAmount, setDepositAmount] = useState(0);
  const { publicKeyHash } = useAccount();
  const [disabledProceed, setDisableProceed] = useState(true);
  const [debouncedAmount] = useDebounce(amount, 500);
  const tezPrice = useAssetUSDPrice("tez");

  const onAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDisableProceed(true);
    setAmount(Number(e.target.value));
  };

  const submitExchangeHandler = async () => {
    try {
      const data = await submitExchange({
        coin_from: coinFrom,
        coin_to: coinTo,
        deposit_amount: amount,
        destination_address: publicKeyHash,
        destination_extra: "",
      });
      await setExchangeData(data);
      if (data.status === ExchangeDataStatusEnum.WAIT) {
        setStep(1);
      } else if (data.status === ExchangeDataStatusEnum.CONFIRMATION) {
        setStep(2);
      } else if (data.status === ExchangeDataStatusEnum.EXCHANGING) {
        setStep(3);
      }
    } catch (e) {
      setIsError(true);
    }
  };
  const { data: rates = { destination_amount: 0, rate: 0, min_amount: "0" } } =
    useSWR(["/api/currency", coinTo, coinFrom, amount], () =>
      getRate({ coin_from: coinFrom, coin_to: coinTo, deposit_amount: amount })
    );

  useEffect(() => {
    (async () => {
      const { rate, ...rest } = await getRate({
        coin_from: coinTo,
        coin_to: coinFrom,
        deposit_amount: (maxDollarValue + avgCommission) / tezPrice!,
      });

      setMaxAmount(
        new BigNumber(rest.destination_amount).toFixed(
          Number(rest.destination_amount) > 100 ? 2 : 6
        )
      );
    })();
  }, [coinFrom, tezPrice]);

  const isMaxAmountError =
    lastMaxAmount !== "Infinity" &&
    debouncedAmount !== 0 &&
    Number(debouncedAmount) > Number(lastMaxAmount);

  useEffect(() => {
    setDepositAmount(rates.destination_amount);
    if (amount === 0) {
      setDisableProceed(true);
    } else if (rates.min_amount === 0) {
      setDisableProceed(true);
    } else if (rates.min_amount > amount) {
      setDisableProceed(true);
    } else if (rates.destination_amount === 0) {
      setDisableProceed(true);
    } else {
      setDisableProceed(false);
    }
    if (rates.min_amount > 0) {
      setLastMinAmount(new BigNumber(rates.min_amount));
    }
    if (maxAmount !== "Infinity") {
      setLastMaxAmount(maxAmount);
    } else {
      setLastMaxAmount("---");
    }
    if (isMaxAmountError) {
      setDisableProceed(true);
    }
  }, [rates, amount, maxAmount, isMaxAmountError, coinFrom]);

  return (
    <>
      {!isError ? (
        <>
          <p className={styles["title"]}>
            <T id={"exchangeDetails"} />
          </p>
          <p className={styles["description"]}>
            <T id={"exchangeDetailsDescription"} />
          </p>
          <WarningComponent currency={coinFrom} />
          <Divider style={{ marginTop: "60px", marginBottom: "10px" }} />
          {/*input 1*/}
          <BuyCryptoInput
            coin={coinFrom}
            setCoin={setCoinFrom}
            type="coinFrom"
            amount={amount}
            lastMinAmount={lastMinAmount}
            onChangeInputHandler={onAmountChange}
            rates={rates}
            maxAmount={lastMaxAmount}
            isMaxAmountError={isMaxAmountError}
          />
          <br />
          <BuyCryptoInput
            readOnly={true}
            value={depositAmount}
            coin={coinTo}
            type="coinTo"
          />
          <Divider style={{ marginTop: "40px", marginBottom: "20px" }} />
          <div className={styles["exchangeRateBlock"]}>
            <p className={styles["exchangeTitle"]}>
              <T id={"exchangeRate"} />
            </p>
            <p className={styles["exchangeData"]}>
              1 {coinFrom} = {rates.rate} {coinTo}
            </p>
          </div>
          <FormSubmitButton
            className="w-full justify-center border-none"
            style={{
              padding: "10px 2rem",
              background: "#4299e1",
              marginTop: "24px",
            }}
            onClick={submitExchangeHandler}
            disabled={disabledProceed}
          >
            <T id={"topUp"} />
          </FormSubmitButton>
          <p className={styles["privacyAndPolicy"]}>
            <T
              id="privacyAndPolicyLinks"
              substitutions={[
                <a
                  className={styles["link"]}
                  rel="noreferrer"
                  href="https://exolix.com/terms"
                  target="_blank"
                >
                  <T id={"termsOfUse"} />
                </a>,
                <a
                  className={styles["link"]}
                  rel="noreferrer"
                  href="https://exolix.com/privacy"
                  target="_blank"
                >
                  <T id={"privacyPolicy"} />
                </a>,
              ]}
            />
          </p>
        </>
      ) : (
        <ErrorComponent
          exchangeData={exchangeData}
          setIsError={setIsError}
          setExchangeData={setExchangeData}
          setStep={setStep}
        />
      )}
    </>
  );
};

export default InitialStep;
