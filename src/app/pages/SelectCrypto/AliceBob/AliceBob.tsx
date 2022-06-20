import React from 'react';

import classNames from 'clsx';

import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';

import { T } from '../../../../lib/i18n/react';
import PageLayout from '../../../layouts/PageLayout';
import styles from '../../BuyCrypto/BuyCrypto.module.css';
import BuyCryptoInput from '../../BuyCrypto/BuyCryptoInput';
import { SelectCryptoSelectors } from '../SelectCrypto.selectors';

export const AliceBob = () => {
  const { trackEvent } = useAnalytics();

  return (
    <PageLayout
      pageTitle={
        <div className="font-medium text-sm">
          <T id="buyWithCard" />
        </div>
      }
    >
      <h3>
        <T id="enterAmount" />
      </h3>
      <a
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
        href=""
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent(SelectCryptoSelectors.AliceBob, AnalyticsEventCategory.ButtonPress)}
      >
        <T id="next" />
      </a>
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
    </PageLayout>
  );
};
