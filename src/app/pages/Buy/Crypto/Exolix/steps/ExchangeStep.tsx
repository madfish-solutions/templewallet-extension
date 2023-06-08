import React, { FC, useEffect, useState } from 'react';

import classNames from 'clsx';

import { FormSubmitButton } from 'app/atoms';
import CopyButton from 'app/atoms/CopyButton';
import Divider from 'app/atoms/Divider';
import HashShortView from 'app/atoms/HashShortView';
import { ReactComponent as CopyIcon } from 'app/icons/copy.svg';
import useTopUpUpdate from 'app/pages/Buy/Crypto/Exolix/hooks/useTopUpUpdate.hook';
import ErrorComponent from 'app/pages/Buy/Crypto/Exolix/steps/ErrorComponent';
import { getCurrentLocale, T } from 'lib/i18n';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';

import { ExchangeDataInterface, ExchangeDataStatusEnum } from '../exolix.interface';
import { ExolixSelectors } from '../Exolix.selectors';
import { getCoinCodeToDisplay } from '../exolix.util';

type dateFormatOptionsValue = 'numeric' | '2-digit';

interface dateFormatOptionsInterface {
  day?: dateFormatOptionsValue;
  month?: dateFormatOptionsValue | 'long';
  year?: dateFormatOptionsValue;
  hour?: dateFormatOptionsValue;
  minute?: dateFormatOptionsValue;
}

const dateFormatOptions: dateFormatOptionsInterface = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric'
};

interface Props {
  exchangeData: ExchangeDataInterface | null;
  setExchangeData: (exchangeData: ExchangeDataInterface | null) => void;
  step: number;
  setStep: (step: number) => void;
  isError: boolean;
  setIsError: (error: boolean) => void;
}

const ExchangeStep: FC<Props> = ({ exchangeData, setExchangeData, setStep, step, isError, setIsError }) => {
  const { copy } = useCopyToClipboard();
  const [sendTime, setSendTime] = useState(new Date());

  useTopUpUpdate(exchangeData, setExchangeData, setIsError);

  useEffect(() => {
    if (!exchangeData) {
      setIsError(true);
      return;
    }
    if (exchangeData.status === ExchangeDataStatusEnum.SUCCESS) {
      setSendTime(new Date(exchangeData.createdAt));
      setStep(4);
    } else if (exchangeData.status === ExchangeDataStatusEnum.EXCHANGING) {
      setSendTime(new Date(exchangeData.createdAt));
      setStep(3);
    } else if (exchangeData.status === ExchangeDataStatusEnum.OVERDUE) {
      setIsError(true);
    }
  }, [exchangeData, setExchangeData, setStep, step, setIsError]);

  if (!exchangeData) {
    return (
      <ErrorComponent
        exchangeData={exchangeData}
        setIsError={setIsError}
        setStep={setStep}
        setExchangeData={setExchangeData}
      />
    );
  }

  return (
    <>
      {(exchangeData.status === ExchangeDataStatusEnum.EXCHANGING ||
        exchangeData.status === ExchangeDataStatusEnum.CONFIRMATION ||
        exchangeData.status === ExchangeDataStatusEnum.OVERDUE) && (
        <>
          <div className="m-auto">
            <p className="text-center text-base mt-4 text-gray-700">
              {(exchangeData.status === ExchangeDataStatusEnum.CONFIRMATION ||
                (exchangeData.status === ExchangeDataStatusEnum.OVERDUE && step === 2)) && <T id={'confirmation'} />}
              {(exchangeData.status === ExchangeDataStatusEnum.EXCHANGING ||
                (exchangeData.status === ExchangeDataStatusEnum.OVERDUE && step === 3)) && <T id={'exchanging'} />}
            </p>
            <p className="text-center text-xs text-gray-700 mt-1">
              <T id={'waitMessage'} />
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
              <Divider style={{ marginTop: '2.25rem' }} />
              <div className="flex justify-between items-baseline mt-4">
                <p className="text-gray-600 text-xs">
                  <T id={'transactionId'} />
                </p>
                <span>
                  <p className="text-xs inline align-text-bottom text-gray-910">{exchangeData.id}</p>
                  <CopyButton
                    text={exchangeData.id}
                    type="link"
                    testID={
                      step === 2 ? ExolixSelectors.topupThirdStepCopyButton : ExolixSelectors.topupFourthStepCopyButton
                    }
                  >
                    <CopyIcon
                      style={{ verticalAlign: 'inherit' }}
                      className={classNames('h-4 ml-1 w-auto inline', 'stroke-orange stroke-2')}
                      onClick={() => copy()}
                    />
                  </CopyButton>
                </span>
              </div>
              <div className="flex justify-between items-baseline mt-4">
                <p className="text-gray-600 text-xs">
                  <T id={'youSend'} />
                </p>
                <p className="text-xs text-gray-910">
                  {exchangeData.amount} {getCoinCodeToDisplay(exchangeData.coinFrom)}
                </p>
              </div>
              <div className="flex justify-between items-baseline mt-2">
                <p className="text-gray-600 text-xs">
                  <T id={'youReceive'} />
                </p>
                <p className="text-xs text-gray-910">
                  {exchangeData.amountTo} {getCoinCodeToDisplay(exchangeData.coinTo)}
                </p>
              </div>
              <div className="flex justify-between items-baseline mt-4">
                <p className="text-gray-600 text-xs">
                  <T id={'depositAddressText'} substitutions={[getCoinCodeToDisplay(exchangeData.coinFrom)]} />
                </p>
                <p className="text-xs text-gray-910">
                  <HashShortView hash={exchangeData.depositAddress} />
                </p>
              </div>
              <div className="flex justify-between items-baseline mt-4">
                <p className="text-gray-600 text-xs">
                  <T id={'recipientAddress'} />
                </p>
                <p className="text-xs text-gray-910">
                  <HashShortView hash={exchangeData.withdrawalAddress} />
                </p>
              </div>
              <Divider style={{ marginTop: '1rem', marginBottom: '3rem' }} />
            </>
          )}
        </>
      )}
      {exchangeData.status === 'success' && (
        <>
          <div className="m-auto">
            <p className="text-center text-base mt-4 text-gray-700">
              <T id={'completed'} />
            </p>
            <p className="text-center text-xs text-gray-700 mt-1">
              <T id={'completedDescription'} />
            </p>
          </div>
          <Divider style={{ marginTop: '2.25rem' }} />
          <div className="flex justify-between items-baseline mt-4">
            <p className="text-gray-600 text-xs">
              <T id={'transactionId'} />
            </p>
            <span>
              <p className="text-xs inline align-text-bottom text-gray-910">{exchangeData.id}</p>
              <CopyButton text={exchangeData.id} type="link">
                <CopyIcon
                  style={{ verticalAlign: 'inherit' }}
                  className={classNames('h-4 ml-1 w-auto inline', 'stroke-orange stroke-2')}
                  onClick={() => copy()}
                />
              </CopyButton>
            </span>
          </div>
          <div className="flex justify-between items-baseline mt-4">
            <p className="text-gray-600 text-xs">
              <T id={'sendTime'} />
            </p>
            <p className="text-xs text-gray-910">
              {sendTime.toLocaleDateString(getCurrentLocale(), dateFormatOptions)}
            </p>
          </div>
          <div className="flex justify-between items-baseline mt-4">
            <p className="text-gray-600 text-xs">
              <T id={'youSend'} />
            </p>
            <p className="text-xs text-gray-910">
              {exchangeData.amount} {getCoinCodeToDisplay(exchangeData.coinFrom)}
            </p>
          </div>
          {exchangeData.hashOut.hash && exchangeData.hashOut.link && (
            <div className="flex justify-between items-baseline mt-2">
              <p className="text-gray-600 text-xs">
                <T id={'inputHash'} />
              </p>
              <p className="text-xs text-gray-910">
                <a className={'text-blue-700 underline'} href={exchangeData.hashOut.link}>
                  <HashShortView hash={exchangeData.hashOut.hash} />
                </a>
              </p>
            </div>
          )}
          <div className="flex justify-between items-baseline mt-4">
            <p className="text-gray-600 text-xs">
              <T id={'depositAddressText'} substitutions={[getCoinCodeToDisplay(exchangeData.coinFrom)]} />
            </p>
            <p className="text-xs text-gray-910">
              <HashShortView hash={exchangeData.depositAddress} />
            </p>
          </div>
          <div className="flex justify-between items-baseline mt-4">
            <p className="text-gray-600 text-xs">You receive:</p>
            <p className="text-xs text-gray-910">
              {exchangeData.amountTo} {getCoinCodeToDisplay(exchangeData.coinTo)}
            </p>
          </div>
          {exchangeData.hashIn.hash && exchangeData.hashIn.link && (
            <div className="flex justify-between items-baseline mt-2">
              <p className="text-gray-600 text-xs">
                <T id={'inputHash'} />
              </p>
              <p className="text-xs text-gray-910">
                <a className={'text-blue-700 underline'} href={exchangeData.hashIn.link}>
                  <HashShortView hash={exchangeData.hashIn.hash} />
                </a>
              </p>
            </div>
          )}

          <div className="flex justify-between items-baseline mt-4">
            <p className="text-gray-600 text-xs">
              <T id={'recipientXtzAddress'} />
            </p>
            <p className="text-xs text-gray-910">
              <HashShortView hash={exchangeData.depositAddress} />
            </p>
          </div>
          <Divider style={{ marginTop: '1rem', marginBottom: '2.5rem' }} />
          <FormSubmitButton
            className="w-full justify-center border-none mb-12"
            style={{
              padding: '10px 2rem',
              background: '#4299e1',
              marginTop: '24px'
            }}
            testID={ExolixSelectors.topupFourthStepSubmitButton}
            onClick={() => {
              setStep(0);
              setExchangeData(null);
            }}
          >
            <T id={'newTopUp'} />
          </FormSubmitButton>
        </>
      )}
    </>
  );
};

export default ExchangeStep;
