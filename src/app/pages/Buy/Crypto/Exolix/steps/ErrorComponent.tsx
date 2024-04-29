import React, { FC, useEffect } from 'react';

import { FormSubmitButton } from 'app/atoms';
import CopyButton from 'app/atoms/CopyButton';
import { ReactComponent as CopyIcon } from 'app/icons/copy.svg';
import { AnalyticsEventCategory, TestIDProps, useAnalytics } from 'lib/analytics';
import { T } from 'lib/i18n';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';

import { ExchangeDataInterface } from '../exolix.interface';
import { ExolixSelectors } from '../Exolix.selectors';

interface Props extends TestIDProps {
  exchangeData: ExchangeDataInterface | null;
  setIsError: (isError: boolean) => void;
  setExchangeData: (exchangeData: ExchangeDataInterface | null) => void;
  setStep: (step: number) => void;
}

const ErrorComponent: FC<Props> = ({ exchangeData, testIDProperties, setIsError, setExchangeData, setStep }) => {
  const { copy } = useCopyToClipboard();
  const { trackEvent } = useAnalytics();

  useEffect(
    () =>
      void trackEvent(
        ExolixSelectors.topupFirstStepTransactionOverdueButton,
        AnalyticsEventCategory.General,
        testIDProperties
      ),
    [trackEvent, testIDProperties]
  );

  const restartTopUpHandler = () => {
    setExchangeData(null);
    setStep(0);
    setIsError(false);
  };
  return (
    <>
      {exchangeData && (
        <>
          <div
            style={{ backgroundColor: '#FCFAFC' }}
            className={'py-2 px-4 rounded-lg border border-red-700 mt-12 mb-10'}
          >
            <p className={'text-red-700 text-base'}>
              <T id={'overdueTransaction'} />
            </p>
            <p className={'text-red-700 text-xs'}>
              <T id={'overdueTransactionMessage'} />
            </p>
          </div>
          <div className="flex justify-between items-baseline mt-4">
            <p className="text-gray-600 text-xs">
              <T id={'transactionId'} />
            </p>
            <span>
              <p className="text-xs inline align-text-bottom text-gray-910">{exchangeData!.id}</p>
              <CopyButton text={exchangeData!.id} type="link">
                <CopyIcon
                  style={{ verticalAlign: 'inherit' }}
                  className="h-4 ml-1 w-auto inline stroke-orange-500 stroke-2"
                  onClick={() => copy()}
                />
              </CopyButton>
            </span>
          </div>
        </>
      )}
      <FormSubmitButton
        className="w-full justify-center border-none mt-6 mb-12"
        style={{
          padding: '10px 2rem',
          background: '#4299e1'
        }}
        onClick={restartTopUpHandler}
        testID={ExolixSelectors.topupFirstStepSubmitAgainButton}
      >
        <T id={'topUpAgain'} />
      </FormSubmitButton>
    </>
  );
};

export default ErrorComponent;
