import React, { FC } from 'react';

import { T } from '../../../../lib/i18n/react';
import { Button } from '../../../atoms/Button';
import ExploreButtonsImg from '../assets/explore-buttons.png';
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
      <img src={ExploreButtonsImg} alt="ExploreButtonsImg" />
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
