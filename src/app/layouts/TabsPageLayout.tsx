import React, { FC, ReactNode, Suspense, useMemo } from 'react';

import clsx from 'clsx';

import Spinner from 'app/atoms/Spinner/Spinner';
import { useTabSlug } from 'app/atoms/useTabSlug';
import { TestIDProperty } from 'lib/analytics';
import { Link } from 'lib/woozie';

import { useAppEnv } from '../env';
import ErrorBoundary from '../ErrorBoundary';

import PageLayout from './PageLayout';

export interface TabInterface extends Required<TestIDProperty> {
  slug: string;
  title: React.ReactNode;
  Component: FC;
  disabled?: boolean;
}

interface Props {
  tabs: TabInterface[];
  Icon?: React.ComponentType;
  title: string;
  description?: string;
}

export const TabsPageLayout: FC<Props> = ({ tabs, Icon, title, description }) => {
  const { fullPage } = useAppEnv();
  const tabSlug = useTabSlug();

  const { slug, Component } = useMemo(() => {
    const tab = tabSlug ? tabs.find(currentTab => currentTab.slug === tabSlug) : null;
    return tab ?? tabs[0];
  }, [tabSlug, tabs]);

  return (
    <PageLayout pageTitle={<PageTitle Icon={Icon} title={title} />}>
      {description && <div className="text-center mt-3 mb-6 text-gray-700 max-w-lg m-auto">{description}</div>}

      <div className={clsx('mt-2 -mx-4', fullPage && 'rounded-t-md')}>
        <div className="border-b border-gray-300">
          <div className="w-full max-w-sm mx-auto flex items-center justify-center">
            {tabs.map(tab => {
              const active = slug === tab.slug;

              return (
                <Link
                  key={tab.slug}
                  to={lctn => (tab.disabled ? lctn : { ...lctn, search: `?tab=${tab.slug}` })}
                  replace
                  className={clsx(
                    'w-full pb-2 border-b-2 text-ulg leading-5 text-center truncate',
                    tabs.length === 1 && 'mx-20',
                    active
                      ? 'border-primary-orange text-primary-orange'
                      : clsx(
                          'border-transparent',
                          tab.disabled ? 'text-gray-350' : 'text-gray-500 hover:text-primary-orange'
                        ),
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

interface PageTitleProps {
  Icon?: React.ComponentType;
  title: string;
}

const PageTitle: FC<PageTitleProps> = ({ Icon, title }) => (
  <div className="flex items-center gap-x-1">
    {Icon && <Icon />}
    <span className="font-normal text-sm">{title}</span>
  </div>
);

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
