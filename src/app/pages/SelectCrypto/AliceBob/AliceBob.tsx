import React, { ChangeEvent, useCallback, useMemo, useState } from 'react';

import classNames from 'clsx';

import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';

import { T } from '../../../../lib/i18n/react';
import { Button } from '../../../atoms/Button';
import { TopUpInput } from '../../../atoms/TopUpInput/TopUpInput';
import PageLayout from '../../../layouts/PageLayout';
import styles from '../../BuyCrypto/BuyCrypto.module.css';
import { SelectCryptoSelectors } from '../SelectCrypto.selectors';

const MIN_UAH_EXCHANGE_AMOUNT = 500;
const MAX_UAH_EXCHANGE_AMOUNT = 29500;

export const AliceBob = () => {
  const { trackEvent } = useAnalytics();

  const [amount, setAmount] = useState(0);

  const onAmountChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setAmount(Number(e.target.value));
    },
    [setAmount]
  );

  const onButtonClick = useCallback(() => {
    trackEvent(SelectCryptoSelectors.AliceBob, AnalyticsEventCategory.ButtonPress);
    window.open('https://www.google.com/', '_blank');
  }, [trackEvent]);

  const isMinAmountError = useMemo(() => amount !== 0 && amount < MIN_UAH_EXCHANGE_AMOUNT, [amount]);
  const isMaxAmountError = useMemo(() => amount !== 0 && amount > MAX_UAH_EXCHANGE_AMOUNT, [amount]);

  return (
    <PageLayout
      pageTitle={
        <div className="font-medium text-sm">
          <T id="buyWithCard" />
        </div>
      }
    >
      <div className="mx-auto my-10 text-center font-inter font-normal text-gray-700" style={{ maxWidth: 360 }}>
        <h3 className="mb-6" style={{ fontSize: 17 }}>
          <T id="enterAmount" />
        </h3>
        <TopUpInput
          type="fiat"
          currency="UAH"
          minAmount={`${MIN_UAH_EXCHANGE_AMOUNT}.00`}
          maxAmount={`${MAX_UAH_EXCHANGE_AMOUNT}.00`}
          isMinAmountError={isMinAmountError}
          isMaxAmountError={isMaxAmountError}
          onChangeInputHandler={onAmountChange}
        />
        <Button
          className={classNames(
            'shadow-sm hover:shadow focus:shadow',
            'py-2 px-4 rounded my-6',
            'border-2',
            'border-blue-500 hover:border-blue-600 focus:border-blue-600',
            'flex items-center justify-center',
            'text-white',
            'text-base font-medium',
            'transition ease-in-out duration-300',
            'bg-blue-500',
            'w-full'
          )}
          disabled={isMinAmountError || isMaxAmountError}
          onClick={onButtonClick}
        >
          <T id="next" />
        </Button>
        <div className="border-solid border-gray-300" style={{ borderTopWidth: 1 }}>
          <p className="mt-6">
            <T
              id="privacyAndPolicyLinks"
              substitutions={[
                <T id={'next'} />,
                <a
                  className={styles['link']}
                  rel="noreferrer"
                  href="https://oval-rhodium-33f.notion.site/End-User-License-Agreement-Abex-Eng-6124123e256d456a83cffc3b2977c4dc"
                  target="_blank"
                >
                  <T id={'termsOfUse'} />
                </a>,
                <a
                  className={styles['link']}
                  rel="noreferrer"
                  href="https://oval-rhodium-33f.notion.site/Privacy-Policy-Abex-Eng-d70fa7cc134341a3ac4fd04816358b9e"
                  target="_blank"
                >
                  <T id={'privacyPolicy'} />
                </a>
              ]}
            />
          </p>
          <p className="mt-6">
            <T id={'warningTopUpServiceMessage'} />
          </p>
        </div>
      </div>
    </PageLayout>
  );
};
