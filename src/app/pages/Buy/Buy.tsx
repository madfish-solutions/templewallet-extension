import React, { FC, ReactNode, Suspense, useMemo } from 'react';

import classNames from 'clsx';

import Spinner from 'app/atoms/Spinner/Spinner';
import { useTabSlug } from 'app/atoms/useTabSlug';
import { useAppEnv } from 'app/env';
import ErrorBoundary from 'app/ErrorBoundary';
import PageLayout from 'app/layouts/PageLayout';
import { T, t } from 'lib/i18n';
import { PropsWithChildren } from 'lib/props-with-children';
import { useGasToken } from 'lib/temple/front';
import { Link } from 'lib/woozie';

import { ReactComponent as ShoppingCartIcon } from './../../icons/shopping-cart.svg';
import { BuySelectors } from './Buy.selectors';
import { Crypto } from './Crypto/Crypto';
import { Debit } from './Debit/Debit';

export const Buy: FC = () => {
  const { fullPage } = useAppEnv();
  const tabSlug = useTabSlug();
  const { assetName } = useGasToken();

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
        Component: Crypto,
        testID: BuySelectors.Crypto
      },
      {
        slug: 'debit',
        title: t('topUpDebit'),
        Component: Debit,
        testID: BuySelectors.Debit
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
        <div className="flex flex-row font-normal text-sm">
          <ShoppingCartIcon />
          <span className="pl-1" style={{ paddingTop: 1 }}>
            <T id="topUpBuy" substitutions={[assetName]} />
          </span>
        </div>
      }
    >
      <div className="text-center my-3 text-gray-700">
        <T id="topUpDescription" substitutions={[assetName, assetName]} />
      </div>
      <div className={classNames('-mx-4', fullPage && 'rounded-t-md')}>
        <div
          className="border-gray-300"
          style={{
            borderBottomWidth: 1
          }}
        >
          <div className={classNames('w-full max-w-sm mx-auto', 'flex items-center justify-center')}>
            {tabs.map(currentTab => {
              const active = slug === currentTab.slug;

              return (
                <Link
                  key={currentTab.slug}
                  to={lctn => ({ ...lctn, search: `?tab=${currentTab.slug}` })}
                  replace
                  className={classNames(
                    'flex1 w-full',
                    'text-center cursor-pointer pb-2',
                    'text-gray-700 text-lg',
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
        </div>

        <div className={'mx-4 mb-4 mt-6'}>
          <SuspenseContainer whileMessage="displaying tab">{Component && <Component />}</SuspenseContainer>
        </div>
      </div>
    </PageLayout>
  );
};

interface SuspenseContainerProps extends PropsWithChildren {
  whileMessage: string;
  fallback?: ReactNode;
}

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
