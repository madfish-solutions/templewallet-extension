import React, { FC, ReactNode, Suspense, useMemo, useState } from 'react';

import classNames from 'clsx';

import Spinner from 'app/atoms/Spinner';
import Stepper from 'app/atoms/Stepper';
import { useAppEnv } from 'app/env';
import ErrorBoundary from 'app/ErrorBoundary';
import PageLayout from 'app/layouts/PageLayout';
import ApproveStep from 'app/pages/BuyCrypto/steps/ApproveStep';
import ExchangeStep from 'app/pages/BuyCrypto/steps/ExchangeStep';
import InitialStep from 'app/pages/BuyCrypto/steps/InitialStep';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { ExchangeDataInterface } from 'lib/exolix-api';
import { T, t } from 'lib/i18n/react';
import { useAccount, useNetwork, useStorage } from 'lib/temple/front';
import { Redirect, useLocation, Link } from 'lib/woozie';

import ExolixImg from './assets/exolix.png';
import MoonPayImg from './assets/moonpay.png';
import RampImg from './assets/ramp.png';
import { BuyCryptoSelectors } from './BuyCypto.selectors';

function useTabSlug() {
  const { search } = useLocation();
  const tabSlug = useMemo(() => {
    const usp = new URLSearchParams(search);
    return usp.get('tab');
  }, [search]);
  return useMemo(() => tabSlug, [tabSlug]);
}

interface BuyCryptoProps {
  crypto?: boolean;
}

const BuyCrypto: FC<BuyCryptoProps> = ({ crypto = false }) => {
  const { fullPage } = useAppEnv();
  const tabSlug = useTabSlug();

  const tabs = useMemo<
    {
      slug: string;
      title: string;
      Component: FC;
      testID: string;
    }[]
  >(() => {
    return [
      {
        slug: 'crypto',
        title: t('topUpCrypto'),
        Component: Cryptos,
        testID: BuyCryptoSelectors.Crypto
      },
      {
        slug: 'debit',
        title: t('topUpDebit'),
        Component: Debits,
        testID: BuyCryptoSelectors.Debit
      }
    ];
  }, []);

  const { slug, Component } = useMemo(() => {
    const tab = tabSlug ? tabs.find(currentTab => currentTab.slug === tabSlug) : null;
    return tab ?? tabs[0];
  }, [tabSlug, tabs]);

  if (crypto) {
    return <BuyCryptoOld />;
  }
  return (
    <PageLayout
      pageTitle={
        <>
          <T id="topUpBuy" />
        </>
      }
    >
      <T id="topUpDescription" />
      <div className={classNames('-mx-4', 'shadow-top-light', fullPage && 'rounded-t-md')}>
        <div className={classNames('w-full max-w-sm mx-auto px-10', 'flex items-center justify-center')}>
          {tabs.map(currentTab => {
            const active = slug === currentTab.slug;

            return (
              <Link
                key={currentTab.slug}
                to={lctn => ({ ...lctn, search: `?tab=${currentTab.slug}` })}
                replace
                className={classNames(
                  'flex1 w-full',
                  'text-center cursor-pointer mb-1 pb-1 pt-2',
                  'text-gray-500 text-xs font-medium',
                  'border-b-2',
                  active ? 'border-primary-orange' : 'border-transparent',
                  active ? 'text-primary-orange' : 'hover:text-primary-orange',
                  'transition ease-in-out duration-300',
                  'truncate'
                )}
                testID={currentTab.testID}
              >
                {currentTab.title}
              </Link>
            );
          })}
        </div>

        <div className={'mx-4 mb-4 mt-6'}>
          <SuspenseContainer whileMessage="displaying tab">{Component && <Component />}</SuspenseContainer>
        </div>
      </div>
    </PageLayout>
  );
};

const Cryptos: FC = () => {
  const { trackEvent } = useAnalytics();
  return (
    <div>
      <div className={classNames('-mx-4', 'shadow-md')}>
        <img src={ExolixImg} alt="ExolixImg" />
        <T id="buyWithExolix" />
        <T id="buyWithExolixDescription" />
        <Link
          className={classNames(
            'py-2 px-4 rounded',
            'border-2',
            'border-blue-500 hover:border-blue-600 focus:border-blue-600',
            'flex items-center justify-center',
            'text-white',
            'shadow-sm hover:shadow focus:shadow',
            'text-base font-semibold',
            'transition ease-in-out duration-300',
            'bg-blue-500',
            'w-35 mr-7'
          )}
          to={'/buy/crypto'}
          onClick={() => trackEvent(BuyCryptoSelectors.Crypto, AnalyticsEventCategory.ButtonPress)}
        >
          <T id="continue" />
        </Link>
      </div>
    </div>
  );
};

const Debits: FC = () => {
  const { trackEvent } = useAnalytics();
  return (
    <div>
      <div className={classNames('-mx-4', 'shadow-md')}>
        <img src={MoonPayImg} alt="MoonPayImg" />
        <T id="buyWithMoonPay" />
        <T id="buyWithMoonPayDescription" />
        <Link
          className={classNames(
            'py-2 px-4 rounded',
            'border-2',
            'border-blue-500 hover:border-blue-600 focus:border-blue-600',
            'flex items-center justify-center',
            'text-white',
            'shadow-sm hover:shadow focus:shadow',
            'text-base font-semibold',
            'transition ease-in-out duration-300',
            'bg-blue-500',
            'w-35 mr-7'
          )}
          to={'/buy/crypto'}
          onClick={() => trackEvent(BuyCryptoSelectors.MoonPay, AnalyticsEventCategory.ButtonPress)}
        >
          <T id="continue" />
        </Link>
      </div>
      <div className={classNames('-mx-4', 'shadow-md')}>
        <img src={RampImg} alt="RampImg" />
        <T id="buyWithRamp" />
        <T id="buyWithRampDescription" />
        <Link
          className={classNames(
            'py-2 px-4 rounded',
            'border-2',
            'border-blue-500 hover:border-blue-600 focus:border-blue-600',
            'flex items-center justify-center',
            'text-white',
            'shadow-sm hover:shadow focus:shadow',
            'text-base font-semibold',
            'transition ease-in-out duration-300',
            'bg-blue-500',
            'w-35 mr-7'
          )}
          to={'/buy/crypto'}
          onClick={() => trackEvent(BuyCryptoSelectors.Ramp, AnalyticsEventCategory.ButtonPress)}
        >
          <T id="continue" />
        </Link>
      </div>
    </div>
  );
};

const BuyCryptoOld: FC = () => (
  <PageLayout
    pageTitle={
      <>
        <T id="buyWithCrypto" />
      </>
    }
  >
    <BuyCryptoContent />
  </PageLayout>
);

export default BuyCrypto;

const steps = [`${t('step')} 1`, `${t('step')} 2`, `${t('step')} 3`, `${t('step')} 4`];

const BuyCryptoContent: FC = () => {
  const network = useNetwork();
  const { publicKeyHash } = useAccount();
  const [step, setStep] = useStorage<number>(`topup_step_state_${publicKeyHash}`, 0);
  const [isError, setIsError] = useState(false);
  const [exchangeData, setExchangeData] = useStorage<ExchangeDataInterface | null>(
    `topup_exchange_data_state_${publicKeyHash}`,
    null
  );
  if (network.type !== 'main') {
    return <Redirect to={'/'} />;
  }

  return (
    <div style={{ maxWidth: '360px', margin: 'auto' }} className="pb-8 text-center">
      <Stepper style={{ marginTop: '64px' }} steps={steps} currentStep={step} />
      {step === 0 && (
        <InitialStep
          isError={isError}
          setIsError={setIsError}
          exchangeData={exchangeData}
          setExchangeData={setExchangeData}
          setStep={setStep}
        />
      )}
      {step === 1 && (
        <ApproveStep
          exchangeData={exchangeData as ExchangeDataInterface}
          setExchangeData={setExchangeData}
          setStep={setStep}
          isError={isError}
          setIsError={setIsError}
        />
      )}
      {(step === 2 || step === 3 || step === 4) && (
        <ExchangeStep
          exchangeData={exchangeData as ExchangeDataInterface}
          setExchangeData={setExchangeData}
          setStep={setStep}
          step={step}
          isError={isError}
          setIsError={setIsError}
        />
      )}
      {step >= 1 && (
        <a
          href={'https://exolix.com/contact'}
          target="_blank"
          rel="noreferrer"
          className="text-blue-500 text-sm mb-8 cursor-pointer inline-block w-auto"
        >
          <T id={'support'} />
        </a>
      )}
      <p className={'mt-6 text-gray-600'}>
        <T id={'warningTopUpServiceMessage'} />
      </p>
    </div>
  );
};

type SuspenseContainerProps = {
  whileMessage: string;
  fallback?: ReactNode;
};

const SuspenseContainer: FC<SuspenseContainerProps> = ({ whileMessage, fallback = <SpinnerSection />, children }) => (
  <ErrorBoundary whileMessage={whileMessage}>
    <Suspense fallback={fallback}>{children}</Suspense>
  </ErrorBoundary>
);

const SpinnerSection: FC = () => (
  <div className="flex justify-center my-12">
    <Spinner theme="gray" className="w-20" />
  </div>
);
