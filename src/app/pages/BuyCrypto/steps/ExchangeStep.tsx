import React, { FC, useEffect, useState } from "react";

import classNames from "clsx";

import CopyButton from "app/atoms/CopyButton";
import Divider from "app/atoms/Divider";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import HashShortView from "app/atoms/HashShortView";
import { ReactComponent as CopyIcon } from "app/icons/copy.svg";
import ErrorComponent from "app/pages/BuyCrypto/steps/ErrorComponent";
import useTopUpUpdate from "app/pages/BuyCrypto/utils/useTopUpUpdate";
import { ExchangeDataInterface, ExchangeDataStatusEnum } from "lib/exolix-api";
import { getCurrentLocale, T } from "lib/i18n/react";
import useCopyToClipboard from "lib/ui/useCopyToClipboard";

interface Props {
  exchangeData: ExchangeDataInterface;
  setExchangeData: (exchangeData: ExchangeDataInterface | null) => void;
  step: number;
  setStep: (step: number) => void;
  isError: boolean;
  setIsError: (error: boolean) => void;
}

const dateFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "numeric",
};

const ExchangeStep: FC<Props> = ({
  exchangeData,
  setExchangeData,
  setStep,
  step,
  isError,
  setIsError,
}) => {
  const { copy } = useCopyToClipboard();
  const [sendTime, setSendTime] = useState(new Date());

  useTopUpUpdate(exchangeData, setExchangeData, setIsError);

  useEffect(() => {
    if (exchangeData.status === ExchangeDataStatusEnum.SUCCESS) {
      setSendTime(new Date(exchangeData.created_at * 1000));
      setStep(4);
    } else if (exchangeData.status === ExchangeDataStatusEnum.EXCHANGING) {
      setSendTime(new Date(exchangeData.created_at * 1000));
      setStep(3);
    } else if (exchangeData.status === ExchangeDataStatusEnum.OVERDUE) {
      setIsError(true);
    }
  }, [exchangeData, setExchangeData, setStep, step, setIsError]);

  return (
    <>
      {(exchangeData.status === ExchangeDataStatusEnum.EXCHANGING ||
        exchangeData.status === ExchangeDataStatusEnum.CONFIRMATION ||
        exchangeData.status === ExchangeDataStatusEnum.OVERDUE) && (
        <>
          <div className="m-auto">
            <p className="text-center text-base mt-4 text-gray-700">
              {(exchangeData.status === ExchangeDataStatusEnum.CONFIRMATION ||
                (exchangeData.status === ExchangeDataStatusEnum.OVERDUE &&
                  step === 2)) && <T id={"confirmation"} />}
              {(exchangeData.status === ExchangeDataStatusEnum.EXCHANGING ||
                (exchangeData.status === ExchangeDataStatusEnum.OVERDUE &&
                  step === 3)) && <T id={"exchanging"} />}
            </p>
            <p className="text-center text-xs text-gray-700 mt-1">
              <T id={"waitMessage"} />
            </p>
          </div>
          {isError ? (
            <ErrorComponent
              exchangeData={exchangeData}
              setExchangeData={setExchangeData}
              setStep={setStep}
              setIsError={setIsError}
            />
          ) : (
            <>
              <Divider style={{ marginTop: "2.25rem" }} />
              <div className="flex justify-between items-baseline mt-4">
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
              <div className="flex justify-between items-baseline mt-4">
                <p className="text-gray-600 text-xs">
                  <T id={"youSend"} />
                </p>
                <p style={{ color: "#1B262C" }} className="text-xs">
                  {exchangeData.amount_from} {exchangeData.coin_from}
                </p>
              </div>
              <div className="flex justify-between items-baseline mt-2">
                <p className="text-gray-600 text-xs">
                  <T id={"youReceive"} />
                </p>
                <p style={{ color: "#1B262C" }} className="text-xs">
                  {exchangeData.amount_to} {exchangeData.coin_to}
                </p>
              </div>
              <div className="flex justify-between items-baseline mt-4">
                <p className="text-gray-600 text-xs">
                  <T
                    id={"depositAddressText"}
                    substitutions={[exchangeData.coin_from]}
                  />
                </p>
                <p style={{ color: "#1B262C" }} className="text-xs">
                  <HashShortView hash={exchangeData.deposit_address} />
                </p>
              </div>
              <div className="flex justify-between items-baseline mt-4">
                <p className="text-gray-600 text-xs">
                  <T id={"recipientAddress"} />
                </p>
                <p style={{ color: "#1B262C" }} className="text-xs">
                  <HashShortView hash={exchangeData.destination_address} />
                </p>
              </div>
              <Divider style={{ marginTop: "1rem", marginBottom: "3rem" }} />
            </>
          )}
        </>
      )}
      {exchangeData.status === "success" && (
        <>
          <div className="m-auto">
            <p className="text-center text-base mt-4 text-gray-700">
              <T id={"completed"} />
            </p>
            <p className="text-center text-xs text-gray-700 mt-1">
              <T id={"completedDescription"} />
            </p>
          </div>
          <Divider style={{ marginTop: "2.25rem" }} />
          <div className="flex justify-between items-baseline mt-4">
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
          <div className="flex justify-between items-baseline mt-4">
            <p className="text-gray-600 text-xs">
              <T id={"sendTime"} />
            </p>
            <p style={{ color: "#1B262C" }} className="text-xs">
              {sendTime.toLocaleDateString(
                getCurrentLocale(),
                dateFormatOptions
              )}
            </p>
          </div>
          <div className="flex justify-between items-baseline mt-4">
            <p className="text-gray-600 text-xs">
              <T id={"youSend"} />
            </p>
            <p style={{ color: "#1B262C" }} className="text-xs">
              {exchangeData.amount_from} {exchangeData.coin_from}
            </p>
          </div>
          {exchangeData.hash_out && exchangeData.hash_out_link && (
            <div className="flex justify-between items-baseline mt-2">
              <p className="text-gray-600 text-xs">
                <T id={"inputHash"} />
              </p>
              <p style={{ color: "#1B262C" }} className="text-xs">
                <a
                  className={"text-blue-700 underline"}
                  href={exchangeData.hash_out_link}
                >
                  <HashShortView hash={exchangeData.hash_out} />
                </a>
              </p>
            </div>
          )}
          <div className="flex justify-between items-baseline mt-4">
            <p className="text-gray-600 text-xs">
              <T
                id={"depositAddressText"}
                substitutions={[exchangeData.coin_from]}
              />
            </p>
            <p style={{ color: "#1B262C" }} className="text-xs">
              <HashShortView hash={exchangeData.deposit_address} />
            </p>
          </div>
          <div className="flex justify-between items-baseline mt-4">
            <p className="text-gray-600 text-xs">You receive:</p>
            <p style={{ color: "#1B262C" }} className="text-xs">
              {exchangeData.amount_to} {exchangeData.coin_to}
            </p>
          </div>
          {exchangeData.hash_in && exchangeData.hash_in_link && (
            <div className="flex justify-between items-baseline mt-2">
              <p className="text-gray-600 text-xs">
                <T id={"inputHash"} />
              </p>
              <p style={{ color: "#1B262C" }} className="text-xs">
                <a
                  className={"text-blue-700 underline"}
                  href={exchangeData.hash_in_link}
                >
                  <HashShortView hash={exchangeData.hash_in} />
                </a>
              </p>
            </div>
          )}

          <div className="flex justify-between items-baseline mt-4">
            <p className="text-gray-600 text-xs">
              <T id={"recipientXtzAddress"} />
            </p>
            <p style={{ color: "#1B262C" }} className="text-xs">
              <HashShortView hash={exchangeData.destination_address} />
            </p>
          </div>
          <Divider style={{ marginTop: "1rem", marginBottom: "2.5rem" }} />
          <FormSubmitButton
            className="w-full justify-center border-none mb-12"
            style={{
              padding: "10px 2rem",
              background: "#4299e1",
              marginTop: "24px",
            }}
            onClick={async () => {
              await setStep(0);
              await setExchangeData(null);
            }}
          >
            <T id={"newTopUp"} />
          </FormSubmitButton>
        </>
      )}
    </>
  );
};

export default ExchangeStep;
