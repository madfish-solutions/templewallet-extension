import React, { FC } from 'react';

import { Button } from 'app/atoms/Button';
import { setTestID } from 'lib/analytics';
import { T } from 'lib/i18n';

import { ReactComponent as BalancesIcon } from '../assets/first.svg';
import styles from '../Onboarding.module.css';
import { OnboardingSelectors } from '../Onboarding.selectors';

interface Props {
  setStep: (step: number) => void;
}

const FirstStep: FC<Props> = ({ setStep }) => {
  return (
    <>
      <p className={styles['title']} {...setTestID(OnboardingSelectors.firstStepText)}>
        <T id={'addressBalanceDetails'} />
      </p>
      <p className={styles['description']}>
        <T id={'addressBalanceDescription'} />
      </p>
      <BalancesIcon />
      <p className={styles['description']} style={{ marginBottom: 0 }}>
        <T id={'addressBalanceHint'} />
      </p>
      <Button
        className="w-full justify-center border-none"
        style={{
          padding: '10px 2rem',
          background: '#4198e0',
          color: '#ffffff',
          marginTop: '40px',
          borderRadius: 4
        }}
        onClick={() => setStep(1)}
        testID={OnboardingSelectors.firstStepNextButton}
      >
        <T id={'next'} />
      </Button>
    </>
  );
};

export default FirstStep;
