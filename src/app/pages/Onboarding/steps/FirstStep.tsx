import React, { FC } from 'react';

import { T } from '../../../../lib/i18n/react';
import { Button } from '../../../atoms/Button';
import { ReactComponent as BalancesIcon } from '../assets/first.svg';
import styles from '../Onboarding.module.css';

interface Props {
  setStep: (step: number) => void;
}

const FirstStep: FC<Props> = ({ setStep }) => {
  return (
    <>
      <p className={styles['title']}>
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
      >
        <T id={'next'} />
      </Button>
    </>
  );
};

export default FirstStep;
