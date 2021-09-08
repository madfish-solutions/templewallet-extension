import React, { ChangeEvent, FC, useEffect, useState } from "react";

import useSWR from "swr";
import { useDebounce } from "use-debounce";

import Divider from "app/atoms/Divider";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import styles from "app/pages/BuyCrypto/BuyCrypto.module.css";
import BuyCryptoInput from "app/pages/BuyCrypto/BuyCryptoInput";
import ErrorComponent from "app/pages/BuyCrypto/steps/ErrorComponent";
import WarningComponent from "app/pages/BuyCrypto/steps/WarningComponent";
import { exchangeDataInterface, getRate, submitExchange } from "lib/exolix-api";
import { T } from "lib/i18n/react";
import { useAccount } from "lib/temple/front";

const coinTo = "XTZ";

interface Props {
  exchangeData: exchangeDataInterface | null;
  setExchangeData: (exchangeData: exchangeDataInterface | null) => void;
  step: number;
  setStep: (step: number) => void;
  isError: boolean;
  setIsError: (error: boolean) => void;
}

const InitialStep: FC<Props> = ({
  exchangeData,
  setExchangeData,
  step,
  setStep,
  isError,
  setIsError,
}) => {
  const [amount, setAmount] = useState(0);
  const [coinFrom, setCoinFrom] = useState("BTC");
  const [depositAmount, setDepositAmount] = useState(0);
  const { publicKeyHash } = useAccount();
  const [disabledProceed, setDisableProceed] = useState(false);
  const [debouncedAmount] = useDebounce(amount, 300);

  const onAmountChange = (e: ChangeEvent<HTMLInputElement>) =>
    setAmount(Number(e.target.value));

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
      setStep(step + 1);
    } catch (e) {
      setIsError(true);
    }
  };
  const {
    data: rates = { destination_amount: 0, rate: 0, min_amount: "0" },
    error,
  } = useSWR(["/api/currency", coinTo, coinFrom, debouncedAmount], () =>
    getRate({ coin_from: coinFrom, coin_to: coinTo, deposit_amount: amount })
  );

  useEffect(() => {
    if (error) {
      setIsError(true);
    }
  }, [error, setIsError]);

  useEffect(() => {
    setDepositAmount(rates.destination_amount);
    if (rates.destination_amount === 0) {
      setDisableProceed(true);
    } else {
      setDisableProceed(false);
    }
  }, [rates]);

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
            onChangeInputHandler={onAmountChange}
            coin={coinFrom}
            setCoin={setCoinFrom}
            type="coinFrom"
            minAmount={rates.min_amount}
          />
          <br />
          <BuyCryptoInput
            readOnly={true}
            value={depositAmount}
            coin={coinTo}
            type="coinTo"
          />
          {/*end input 1*/}
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
          {/*<p className={styles['privacyAndPolicy']}>By clicking Exchange you agree with <a className={styles['link']} href='#'>Terms of Use</a> and <a className={styles['link']} href='#'>Privacy Policy</a></p>*/}
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
