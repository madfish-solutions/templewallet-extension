import React, { FC, useEffect } from "react";

import classNames from "clsx";
import Countdown from "react-countdown";
import { QRCode } from "react-qr-svg";

import CopyButton from "app/atoms/CopyButton";
import Divider from "app/atoms/Divider";
import FormField from "app/atoms/FormField";
import HashShortView from "app/atoms/HashShortView";
import { ReactComponent as CopyIcon } from "app/icons/copy.svg";
import ErrorComponent from "app/pages/BuyCrypto/steps/ErrorComponent";
import useTopUpUpdate from "app/pages/BuyCrypto/utils/useTopUpUpdate";
import {
  ExchangeDataInterface,
  ExchangeDataStatusEnum,
  getExchangeData,
} from "lib/exolix-api";
import { T } from "lib/i18n/react";
import useCopyToClipboard from "lib/ui/useCopyToClipboard";

import WarningComponent from "./WarningComponent";

interface Props {
  exchangeData: ExchangeDataInterface;
  setExchangeData: (exchangeData: ExchangeDataInterface | null) => void;
  setStep: (step: number) => void;
  isError: boolean;
  setIsError: (error: boolean) => void;
}

const ApproveStep: FC<Props> = ({
  exchangeData,
  setExchangeData,
  setStep,
  isError,
  setIsError,
}) => {
  const { copy } = useCopyToClipboard();

  useTopUpUpdate(exchangeData, setExchangeData, setIsError);

  useEffect(() => {
    if (exchangeData) {
      if (exchangeData.status === ExchangeDataStatusEnum.CONFIRMATION) {
        setStep(2);
      }
      if (exchangeData.status === ExchangeDataStatusEnum.EXCHANGING) {
        setStep(3);
      }
      if (exchangeData.status === ExchangeDataStatusEnum.OVERDUE) {
        setIsError(true);
      }
    }
  }, [exchangeData, setStep, setIsError]);

  return (
    <>
      <div className="w-64 m-auto">
        <p className="text-center text-base mt-4 text-gray-700">
          <T id={"deposit"} />
        </p>
        <p className="text-center text-xs text-gray-700 mt-1">
          <T id={"depositDescription"} />
        </p>
      </div>
      {isError ? (
        <ErrorComponent
          exchangeData={exchangeData}
          setIsError={setIsError}
          setStep={setStep}
          setExchangeData={setExchangeData}
        />
      ) : (
        <>
          <Countdown
            renderer={(props) => (
              <p
                style={{ color: "#1B262C" }}
                className="text-center mt-12 text-2xl"
              >
                {props.minutes}:
                {props.seconds < 10 ? "0" + props.seconds : props.seconds}
              </p>
            )}
            date={exchangeData.created_at * 1000 + 3600000}
            onComplete={async () => {
              const data = await getExchangeData(exchangeData.id);
              setExchangeData(data);
            }}
          />
          <WarningComponent amountAttention />
          <Divider style={{ marginBottom: "1.5rem", marginTop: "2rem" }} />
          <div className="flex justify-between items-baseline">
            <p className="text-gray-600 text-xs">
              <T id={"sendByOneTransaction"} />
            </p>
            <p style={{ color: "#1B262C" }} className="text-2xl">
              {exchangeData.amount_from} {exchangeData.coin_from}
            </p>
          </div>
          <div className="flex justify-between items-baseline">
            <p className="text-gray-600 text-xs">
              <T id={"youGet"} />
            </p>
            <p style={{ color: "#1B262C" }} className="text-xs">
              {exchangeData.amount_to} {exchangeData.coin_to}
            </p>
          </div>
          <div className="flex justify-between items-baseline">
            <p className="text-gray-600 text-xs">
              <T id={"fixedRate"} />
            </p>
            <p style={{ color: "#1B262C" }} className="text-xs">
              1 {exchangeData.coin_from} = {exchangeData.rate}{" "}
              {exchangeData.coin_to}
            </p>
          </div>
          <div className="flex justify-between items-baseline">
            <p className="text-gray-600 text-xs">
              <T id={"transactionId"} />
            </p>
            <span>
              <p
                style={{ color: "#1B262C" }}
                className="text-xs inline align-text-bottom"
              >
                {exchangeData.id}
              </p>
              <CopyButton text={exchangeData.id} type="link">
                <CopyIcon
                  style={{ verticalAlign: "inherit" }}
                  className={classNames(
                    "h-4 ml-1 w-auto inline",
                    "stroke-orange stroke-2"
                  )}
                  onClick={() => copy()}
                />
              </CopyButton>
            </span>
          </div>
          <p className="text-gray-600 text-xs text-center mt-6">
            <T
              id={"depositAddressText"}
              substitutions={[exchangeData.coin_from]}
            />
          </p>
          <QRCode
            value={exchangeData.deposit_address}
            style={{ width: "160px", margin: "24px auto" }}
          />
          <FormField
            rows={2}
            size={36}
            spellCheck={false}
            readOnly
            style={{
              resize: "none",
              textAlign: "center",
            }}
            textarea
            value={exchangeData.deposit_address}
            copyable
          />
          {exchangeData.deposit_extra !== null && (
            <>
              <p className="text-gray-600 text-xs text-center mt-6">
                <T id={"atomDepositMemo"} />
              </p>
              <QRCode
                value={exchangeData.deposit_extra}
                style={{ width: "160px", margin: "24px auto" }}
              />
              <FormField
                rows={1}
                size={36}
                spellCheck={false}
                readOnly
                style={{
                  resize: "none",
                  textAlign: "center",
                }}
                textarea
                value={exchangeData.deposit_extra}
                copyable
              />
            </>
          )}

          <Divider style={{ marginTop: "2.5rem" }} />
          <div className="flex justify-between items-baseline mt-4 mb-12">
            <p className="text-gray-600 text-xs">
              <T id={"recipientAddress"} />
            </p>
            <p style={{ color: "#1B262C" }} className="text-xs">
              <HashShortView hash={exchangeData.destination_address} />
            </p>
          </div>
          <div>
            <p
              onClick={() => {
                setStep(0);
              }}
              className="text-red-700 text-sm mb-8 inline-block cursor-pointer inline-block w-auto"
            >
              <T id={"cancel"} />
            </p>
          </div>
        </>
      )}
    </>
  );
};

export default ApproveStep;
