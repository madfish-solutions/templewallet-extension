import React, { ChangeEvent, useCallback, useState } from 'react';

import classNames from 'clsx';

import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';

import { T } from '../../../../lib/i18n/react';
import { Button } from '../../../atoms/Button';
import { TopUpInput } from '../../../atoms/TopUpInput/TopUpInput';
import PageLayout from '../../../layouts/PageLayout';
import styles from '../../BuyCrypto/BuyCrypto.module.css';
import { SelectCryptoSelectors } from '../SelectCrypto.selectors';

export const AliceBob = () => {
  const { trackEvent } = useAnalytics();

  const [amount, setAmount] = useState(0);
  const [disabledProceed, setDisableProceed] = useState(true);

  const onAmountChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setDisableProceed(true);
      setAmount(Number(e.target.value));
    },
    [setAmount, setDisableProceed]
  );

  const onButtonClick = useCallback(() => {
    trackEvent(SelectCryptoSelectors.AliceBob, AnalyticsEventCategory.ButtonPress);
    window.open('https://www.google.com/', '_blank');
  }, [trackEvent]);

  return (
    <PageLayout
      pageTitle={
        <div className="font-medium text-sm">
          <T id="buyWithCard" />
        </div>
      }
    >
      <div className="flex" style={{ maxWidth: 360 }}>
        <h3>
          <T id="enterAmount" />
        </h3>
        <TopUpInput
          type="fiat"
          currency="UAH"
          minAmount="500.00"
          maxAmount="29500.00"
          amount={amount}
          onChangeInputHandler={onAmountChange}
        />
        <Button
          className={classNames(
            'shadow-sm hover:shadow focus:shadow',
            'py-2 px-4 rounded mt-4',
            'border-2',
            'border-blue-500 hover:border-blue-600 focus:border-blue-600',
            'flex items-center justify-center',
            'text-white',
            'text-base font-medium',
            'transition ease-in-out duration-300',
            'bg-blue-500',
            'w-full'
          )}
          disabled={disabledProceed}
          onClick={onButtonClick}
        >
          <T id="next" />
        </Button>
        <div>
          <p>
            <T
              id="privacyAndPolicyLinks"
              substitutions={[
                <T id={'next'} />,
                <a className={styles['link']} rel="noreferrer" href="https://exolix.com/terms" target="_blank">
                  <T id={'termsOfUse'} />
                </a>,
                <a className={styles['link']} rel="noreferrer" href="https://exolix.com/privacy" target="_blank">
                  <T id={'privacyPolicy'} />
                </a>
              ]}
            />
          </p>
          <p className="mt-6 text-gray-600">
            <T id={'warningTopUpServiceMessage'} />
          </p>
        </div>
      </div>
    </PageLayout>
  );
};
