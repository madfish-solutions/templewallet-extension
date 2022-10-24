import React, { FC } from 'react';

import { Button } from 'app/atoms/Button';
import { T } from 'lib/i18n';

import { ReactComponent as ButtonsIcon } from '../assets/second.svg';
import styles from '../Onboarding.module.css';

interface Props {
  setStep: (step: number) => void;
}

const SecondStep: FC<Props> = ({ setStep }) => {
  return (
    <>
      <p className={styles['title']}>
        <T id={'howToStartDetails'} />
      </p>
      <p className={styles['description']} style={{ marginBottom: 0 }}>
        <T id={'howToStartDescription1'} />
      </p>
      <p className={styles['description']} style={{ marginTop: 20 }}>
        <T id={'howToStartDescription2'} />
      </p>
      <ButtonsIcon />
      <p className={styles['description']} style={{ marginBottom: 0 }}>
        <T id={'howToStartHint'} />
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
        onClick={() => setStep(2)}
      >
        <T id={'next'} />
      </Button>
    </>
  );
};

export default SecondStep;
