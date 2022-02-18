import React, { FC, ReactNode, Suspense, useMemo } from 'react';

import classNames from 'clsx';

import Spinner from 'app/atoms/Spinner';
import { useTabSlug } from 'app/atoms/useTabSlug';
import { useAppEnv } from 'app/env';
import ErrorBoundary from 'app/ErrorBoundary';
import PageLayout from 'app/layouts/PageLayout';
import { T, t } from 'lib/i18n/react';
import { Link } from 'lib/woozie';

import { Cryptos } from './Cryptos';
import { Debits } from './Debits';
import { SelectCryptoSelectors } from './SelectCrypto.selectors';

const SelectCrypto: FC<{}> = () => {
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
        testID: SelectCryptoSelectors.Crypto
      },
      {
        slug: 'debit',
        title: t('topUpDebit'),
        Component: Debits,
        testID: SelectCryptoSelectors.Debit
      }
    ];
  }, []);

  const { slug, Component } = useMemo(() => {
    const tab = tabSlug ? tabs.find(currentTab => currentTab.slug === tabSlug) : null;
    return tab ?? tabs[0];
  }, [tabSlug, tabs]);
  return (
    <PageLayout
      pageTitle={
        <>
          <T id="topUpBuy" />
        </>
      }
    >
      <div className="text-center my-3">
        <T id="topUpDescription" />
      </div>
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

export default SelectCrypto;

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
