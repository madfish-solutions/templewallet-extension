import React, { FC } from 'react';

import clsx from 'clsx';

import { Button, Stepper } from 'app/atoms';
import PageLayout from 'app/layouts/PageLayout';
import { t, T } from 'lib/i18n';
import { useStorage } from 'lib/temple/front';

import { useOnboardingProgress } from './hooks/useOnboardingProgress.hook';
import { OnboardingSelectors } from './Onboarding.selectors';
import CongratsPage from './pages/CongratsPage';
import FirstStep from './steps/FirstStep';
import FourthStep from './steps/FourthStep';
import SecondStep from './steps/SecondStep';
import ThirdStep from './steps/ThirdStep';

const Onboarding: FC = () => {
  const { setOnboardingCompleted } = useOnboardingProgress();

  const [step, setStep] = useStorage<number>(`onboarding_step_state`, 0);

  const steps = (stepWord => [`${stepWord} 1`, `${stepWord} 2`, `${stepWord} 3`, `${stepWord} 4`])(t('step'));

  return (
    <PageLayout
      pageTitle={<T id={step >= 1 ? 'onboarding' : 'welcomeToOnboarding'} />}
      step={step}
      setStep={setStep}
      headerRightElem={
        step < 4 ? (
          <Button
            className={clsx(
              'flex items-center px-4 py-2 rounded',
              'text-font-medium-bold leading-none text-gray-600 text-shadow-black',
              'opacity-90 hover:opacity-100 hover:bg-black hover:bg-opacity-5',
              'transition duration-300 ease-in-out'
            )}
            onClick={() => setOnboardingCompleted(true)}
            testID={OnboardingSelectors.skipButton}
          >
            <T id="skip" />
          </Button>
        ) : null
      }
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
