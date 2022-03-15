import React, { FC } from 'react';

import { T } from '../../../../lib/i18n/react';
import { Button } from '../../../atoms/Button';
import TokensCollectibleImg from '../assets/tokens-collectible.png';
import styles from '../Onboarding.module.css';

interface Props {
  setStep: (step: number) => void;
}

const ThirdStep: FC<Props> = ({ setStep }) => {
  return (
    <>
      <p className={styles['title']}>
        <T id={'tokensCollectibleDetails'} />
      </p>
      <p className={styles['description']} style={{ marginBottom: 0 }}>
        <T id={'tokensCollectibleDescription1'} />
      </p>
      <p className={styles['description']} style={{ marginTop: 20 }}>
        <T id={'tokensCollectibleDescription2'} />
      </p>
      <img src={TokensCollectibleImg} alt="TokensCollectibleImg" />
      <p className={styles['description']} style={{ marginBottom: 0 }}>
        <T id={'tokensCollectibleHint'} />
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
        onClick={() => setStep(3)}
      >
        <T id={'next'} />
      </Button>
    </>
  );
};

export default ThirdStep;
