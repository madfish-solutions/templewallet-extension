import React, { FC, useCallback, useState } from 'react';

import { Stepper } from 'app/atoms';
import PageLayout from 'app/layouts/PageLayout';
import ApproveStep from 'app/pages/Buy/Crypto/Exolix/steps/ApproveStep';
import ExchangeStep from 'app/pages/Buy/Crypto/Exolix/steps/ExchangeStep';
import InitialStep from 'app/pages/Buy/Crypto/Exolix/steps/InitialStep';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { useAccount, useNetwork, useStorage } from 'lib/temple/front';
import { Redirect } from 'lib/woozie';

import { EXOLIX_CONTACT_LINK } from './config';
import { ExchangeDataInterface } from './exolix.interface';
import { ExolixSelectors } from './Exolix.selectors';

const Exolix: FC = () => (
  <PageLayout
    pageTitle={
      <div className="font-medium text-sm">
        <T id="buyWithCrypto" />
      </div>
    }
  >
    <BuyCryptoContent />
  </PageLayout>
);

export default Exolix;

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
    let event: ExolixSelectors;
    switch (step) {
      case 2:
        event = ExolixSelectors.topupSecondStepSupportButton;
        break;
      case 3:
        event = ExolixSelectors.topupThirdStepSupportButton;
        break;
      default:
        event = ExolixSelectors.topupFourthStepSubmitButton;
        break;
    }
    return trackEvent(event, AnalyticsEventCategory.ButtonPress);
  }, [step, trackEvent]);

  if (network.type !== 'main') {
    return <Redirect to={'/'} />;
  }

  const steps = (stepWord => [`${stepWord} 1`, `${stepWord} 2`, `${stepWord} 3`, `${stepWord} 4`])(t('step'));

  return (
    <div className="pb-8 text-center max-w-sm mx-auto">
      <Stepper style={{ marginTop: 8 }} steps={steps} currentStep={step} />
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
          href={EXOLIX_CONTACT_LINK}
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
