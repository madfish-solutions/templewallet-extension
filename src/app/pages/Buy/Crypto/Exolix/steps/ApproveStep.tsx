import React, { FC, useEffect } from 'react';

import Countdown from 'react-countdown';
import { QRCode } from 'react-qr-svg';

import { FormField } from 'app/atoms';
import CopyButton from 'app/atoms/CopyButton';
import Divider from 'app/atoms/Divider';
import HashShortView from 'app/atoms/HashShortView';
import { ReactComponent as CopyIcon } from 'app/icons/copy.svg';
import useTopUpUpdate from 'app/pages/Buy/Crypto/Exolix/hooks/useTopUpUpdate.hook';
import ErrorComponent from 'app/pages/Buy/Crypto/Exolix/steps/ErrorComponent';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { T } from 'lib/i18n';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';

import { ExchangeDataInterface, ExchangeDataStatusEnum } from '../exolix.interface';
import { ExolixSelectors } from '../Exolix.selectors';
import { getExchangeData } from '../exolix.util';
import WarningComponent from './WarningComponent';

interface Props {
  exchangeData: ExchangeDataInterface | null;
  setExchangeData: (exchangeData: ExchangeDataInterface | null) => void;
  setStep: (step: number) => void;
  isError: boolean;
  setIsError: (error: boolean) => void;
}

const FORTY_FIVE_MINUTES_IN_MS = 45 * 60 * 1000;

const ApproveStep: FC<Props> = ({ exchangeData, setExchangeData, setStep, isError, setIsError }) => {
  const { copy } = useCopyToClipboard();

  const { trackEvent } = useAnalytics();

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

  if (exchangeData && !exchangeData.coinFrom) {
    setIsError(true);
    return null;
  }

  return (
    <>
      <div className="w-64 m-auto">
        <p className="text-center text-base mt-4 text-gray-700">
          <T id={'deposit'} />
        </p>
        <p className="text-center text-xs text-gray-700 mt-1">
          <T id={'depositDescription'} />
        </p>
      </div>
      {isError || !exchangeData ? (
        <ErrorComponent
          exchangeData={exchangeData}
          setIsError={setIsError}
          setStep={setStep}
          setExchangeData={setExchangeData}
        />
      ) : (
        <>
          <Countdown
            renderer={props => (
              <p className="text-center mt-12 text-2xl text-gray-910">
                {props.minutes}:{props.seconds < 10 ? '0' + props.seconds : props.seconds}
              </p>
            )}
            date={new Date(exchangeData.createdAt).getTime() + FORTY_FIVE_MINUTES_IN_MS}
            onComplete={async () => {
              const data = await getExchangeData(exchangeData.id);
              setExchangeData(data);
            }}
          />
          <WarningComponent amountAttention />
          <Divider style={{ marginBottom: '1.5rem', marginTop: '2rem' }} />
          <div className="flex justify-between items-baseline">
            <p className="text-gray-600 text-xs">
              <T id={'sendByOneTransaction'} />
            </p>
            <p className="text-2xl text-gray-910">
              {exchangeData.amount} {exchangeData.coinFrom.coinCode}
            </p>
          </div>
          <div className="flex justify-between items-baseline">
            <p className="text-gray-600 text-xs">
              <T id={'youGet'} />
            </p>
            <p className="text-xs text-gray-910">
              {exchangeData.amountTo} {exchangeData.coinTo.coinCode}
            </p>
          </div>
          <div className="flex justify-between items-baseline">
            <p className="text-gray-600 text-xs">
              <T id={'fixedRate'} />
            </p>
            <p className="text-xs text-gray-910">
              1 {exchangeData.coinFrom.coinCode} = {exchangeData.rate} {exchangeData.coinTo.coinCode}
            </p>
          </div>
          <div className="flex justify-between items-baseline">
            <p className="text-gray-600 text-xs">
              <T id={'transactionId'} />
            </p>
            <span>
              <p className="text-xs inline align-text-bottom text-gray-910">{exchangeData.id}</p>
              <CopyButton text={exchangeData.id} type="link" testID={ExolixSelectors.topupSecondStepCopyButton}>
                <CopyIcon
                  style={{ verticalAlign: 'inherit' }}
                  className="h-4 ml-1 w-auto inline stroke-orange stroke-2"
                  onClick={() => copy()}
                />
              </CopyButton>
            </span>
          </div>
          <p className="text-gray-600 text-xs text-center mt-6">
            <T id={'depositAddressText'} substitutions={[exchangeData.coinFrom.networkName]} />
          </p>
          <QRCode value={exchangeData.depositAddress} style={{ width: '160px', margin: '24px auto' }} />
          <FormField
            rows={2}
            size={36}
            spellCheck={false}
            readOnly
            style={{
              resize: 'none',
              textAlign: 'center'
            }}
            textarea
            value={exchangeData.depositAddress}
            copyable
          />
          {exchangeData.depositExtraId !== null && exchangeData.depositExtraId !== 'null' && (
            <>
              <p className="text-gray-600 text-xs text-center mt-6">
                <T id={'atomDepositMemo'} />
              </p>
              <QRCode value={exchangeData.depositExtraId} style={{ width: '160px', margin: '24px auto' }} />
              <FormField
                rows={1}
                size={36}
                spellCheck={false}
                readOnly
                style={{
                  resize: 'none',
                  textAlign: 'center'
                }}
                textarea
                value={exchangeData.depositExtraId}
                copyable
              />
            </>
          )}

          <Divider style={{ marginTop: '2.5rem' }} />
          <div className="flex justify-between items-baseline mt-4 mb-12">
            <p className="text-gray-600 text-xs">
              <T id={'recipientAddress'} />
            </p>
            <p className="text-xs text-gray-910">
              <HashShortView hash={exchangeData.depositAddress} />
            </p>
          </div>
          <div>
            <p
              onClick={() => {
                trackEvent(ExolixSelectors.topupSecondStepCancelButton, AnalyticsEventCategory.ButtonPress);
                setStep(0);
              }}
              className="font inter font-medium text-red-700 text-sm mb-8 inline-block cursor-pointer inline-block w-auto"
            >
              <T id={'cancel'} />
            </p>
          </div>
        </>
      )}
    </>
  );
};

export default ApproveStep;
