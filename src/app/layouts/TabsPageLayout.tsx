import React, { FC, ReactNode, Suspense, useMemo } from 'react';

import classNames from 'clsx';

import { PageTitle } from 'app/atoms/PageTitle';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useTabSlug } from 'app/atoms/useTabSlug';
import { TestIDProperty } from 'lib/analytics';
import { Link } from 'lib/woozie';

import { useAppEnv } from '../env';
import ErrorBoundary from '../ErrorBoundary';

import PageLayout from './PageLayout';

export interface TabInterface extends Required<TestIDProperty> {
  slug: string;
  title: string;
  Component: FC;
}

interface Props {
  tabs: TabInterface[];
  icon: JSX.Element;
  title: string;
  description: string;
}

export const TabsPageLayout: FC<Props> = ({ tabs, icon, title, description }) => {
  const { fullPage } = useAppEnv();
  const tabSlug = useTabSlug();

  const { slug, Component } = useMemo(() => {
    const tab = tabSlug ? tabs.find(currentTab => currentTab.slug === tabSlug) : null;
    return tab ?? tabs[0];
  }, [tabSlug, tabs]);

  return (
    <PageLayout pageTitle={<PageTitle icon={icon} title={title} />}>
      <div className="text-center my-3 text-gray-700 max-w-lg m-auto">{description}</div>
      <div className={classNames('-mx-4', fullPage && 'rounded-t-md')}>
        <div
          className="border-gray-300"
          style={{
            borderBottomWidth: 1
          }}
        >
          <div className="w-full max-w-sm mx-auto mt-6 flex items-center justify-center">
            {tabs.map(tab => {
              const active = slug === tab.slug;

              return (
                <Link
                  key={tab.slug}
                  to={lctn => ({ ...lctn, search: `?tab=${tab.slug}` })}
                  replace
                  className={classNames(
                    'flex1 w-full text-center cursor-pointer pb-2',
                    'border-b-2 text-gray-700 text-lg truncate',
                    tabs.length === 1 && 'mx-20',
                    active
                      ? 'border-primary-orange text-primary-orange'
                      : 'border-transparent hover:text-primary-orange',
                    'transition ease-in-out duration-300'
                  )}
                  testID={tab.testID}
                >
                  {tab.title}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mx-4 mb-4 mt-6">
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
