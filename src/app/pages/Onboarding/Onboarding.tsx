import React, { FC } from 'react';

import { Stepper } from 'app/atoms';
import PageLayout from 'app/layouts/PageLayout';
import { t, T } from 'lib/i18n';
import { useStorage } from 'lib/temple/front';

import CongratsPage from './pages/CongratsPage';
import FirstStep from './steps/FirstStep';
import FourthStep from './steps/FourthStep';
import SecondStep from './steps/SecondStep';
import ThirdStep from './steps/ThirdStep';

const steps = [`${t('step')} 1`, `${t('step')} 2`, `${t('step')} 3`, `${t('step')} 4`];

const Onboarding: FC = () => {
  const [step, setStep] = useStorage<number>(`onboarding_step_state`, 0);

  return (
    <PageLayout
      pageTitle={
        <span style={step !== 4 ? { marginLeft: 62 } : {}}>
          {step >= 1 ? <T id="onboarding" /> : <T id="welcomeToOnboarding" />}
        </span>
      }
      step={step}
      setStep={setStep}
      skip={step < 4}
    >
      <div style={{ maxWidth: '360px', margin: 'auto' }} className="pb-8 text-center">
        {step < 4 && <Stepper style={{ marginTop: '40px' }} steps={steps} currentStep={step} />}
        {step === 0 && <FirstStep setStep={setStep} />}
        {step === 1 && <SecondStep setStep={setStep} />}
        {step === 2 && <ThirdStep setStep={setStep} />}
        {step === 3 && <FourthStep setStep={setStep} />}
        {step === 4 && <CongratsPage />}
      </div>
    </PageLayout>
  );
};

export default Onboarding;
