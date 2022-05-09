import React, { FC, useCallback, useState } from 'react';

import Stepper from 'app/atoms/Stepper';
import PageLayout from 'app/layouts/PageLayout';
import ApproveStep from 'app/pages/BuyCrypto/steps/ApproveStep';
import ExchangeStep from 'app/pages/BuyCrypto/steps/ExchangeStep';
import InitialStep from 'app/pages/BuyCrypto/steps/InitialStep';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { ExchangeDataInterface } from 'lib/exolix-api';
import { T, t } from 'lib/i18n/react';
import { useAccount, useNetwork, useStorage } from 'lib/temple/front';
import { Redirect } from 'lib/woozie';

import { BuyCryptoSelectors } from './BuyCrypto.selectors';

const BuyCrypto: FC = () => (
  <PageLayout
    pageTitle={
      <>
        <T id="buyWithCrypto" />
      </>
    }
  >
    <BuyCryptoContent />
  </PageLayout>
);

export default BuyCrypto;

const steps = [`${t('step')} 1`, `${t('step')} 2`, `${t('step')} 3`, `${t('step')} 4`];

const BuyCryptoContent: FC = () => {
  const { trackEvent } = useAnalytics();
  const network = useNetwork();
  const { publicKeyHash } = useAccount();
  const [step, setStep] = useStorage<number>(`topup_step_state_${publicKeyHash}`, 0);
  const [isError, setIsError] = useState(false);
  const [exchangeData, setExchangeData] = useStorage<ExchangeDataInterface | null>(
    `topup_exchange_data_state_${publicKeyHash}`,
    null
  );

  const handleTrackSupportSubmit = useCallback(() => {
    let event: BuyCryptoSelectors;
    switch (step) {
      case 2:
        event = BuyCryptoSelectors.TopupSecondStepSupport;
        break;
      case 3:
        event = BuyCryptoSelectors.TopupThirdStepSupport;
        break;
      default:
        event = BuyCryptoSelectors.TopupFourthStepSubmit;
        break;
    }
    return trackEvent(event, AnalyticsEventCategory.ButtonPress);
  }, [step, trackEvent]);

  if (network.type !== 'main') {
    return <Redirect to={'/'} />;
  }

  return (
    <div style={{ maxWidth: '360px', margin: 'auto' }} className="pb-8 text-center">
      <Stepper style={{ marginTop: '64px' }} steps={steps} currentStep={step} />
      {step === 0 && (
        <InitialStep
          isError={isError}
          setIsError={setIsError}
          exchangeData={exchangeData}
          setExchangeData={setExchangeData}
          setStep={setStep}
        />
      )}
      {step === 1 && (
        <ApproveStep
          exchangeData={exchangeData}
          setExchangeData={setExchangeData}
          setStep={setStep}
          isError={isError}
          setIsError={setIsError}
        />
      )}
      {(step === 2 || step === 3 || step === 4) && (
        <ExchangeStep
          exchangeData={exchangeData}
          setExchangeData={setExchangeData}
          setStep={setStep}
          step={step}
          isError={isError}
          setIsError={setIsError}
        />
      )}
      {step >= 1 && (
        <a
          href={'https://docs.google.com/forms/d/e/1FAIpQLSdec4jK16R8uQ-05MRk7QgNi7y3PE5l7ojI5dvMYlfrX2LKDQ/viewform'}
          target="_blank"
          rel="noreferrer"
          className="text-blue-500 text-sm mb-8 cursor-pointer inline-block w-auto"
          onClick={handleTrackSupportSubmit}
        >
          <T id={'support'} />
        </a>
      )}
      <p className={'mt-6 text-gray-600'}>
        <T id={'warningTopUpServiceMessage'} />
      </p>
    </div>
  );
};
