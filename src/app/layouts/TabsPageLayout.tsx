import React, { FC, useMemo } from 'react';

import classNames from 'clsx';

import { PageTitle } from 'app/atoms/PageTitle';
import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useLocationSearchParamValue } from 'app/hooks/use-location';
import { TestIDProperty } from 'lib/analytics';
import { Link } from 'lib/woozie';

import PageLayout from './PageLayout';

export interface TabInterface extends TestIDProperty {
  slug: string;
  title: string;
  Component: FC;
  description?: string;
}

interface Props {
  tabs: TabInterface[];
  Icon: ImportedSVGComponent;
  title: string;
}

export const TabsPageLayout: FC<Props> = ({ tabs, Icon, title }) => {
  const tabSlug = useLocationSearchParamValue('tab');

  const { slug, Component, description } = useMemo(() => {
    const tab = tabSlug ? tabs.find(currentTab => currentTab.slug === tabSlug) : null;
    return tab ?? tabs[0];
  }, [tabSlug, tabs]);

  return (
    <PageLayout pageTitle={<PageTitle Icon={Icon} title={title} />} contentPadding={false}>
      <div className="mt-4 flex justify-center border-b border-lines">
        {tabs.map(tab => {
          const active = slug === tab.slug;

          return (
            <Link
              key={tab.slug}
              to={lctn => ({ ...lctn, search: `?tab=${tab.slug}` })}
              replace
              className={classNames(
                'flex-1 w-full text-center cursor-pointer pb-2',
                'border-b-2 text-gray-700 text-lg truncate',
                tabs.length === 1 && 'mx-20',
                active ? 'border-primary-orange text-primary-orange' : 'border-transparent hover:text-primary-orange',
                'transition ease-in-out duration-300'
              )}
              testID={tab.testID}
            >
              {tab.title}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col px-4 pt-6 pb-15">
        <div className="mb-4 text-center text-grey-2">{description}</div>

        <SuspenseContainer errorMessage="displaying tab">{Component && <Component />}</SuspenseContainer>
      </div>
    </PageLayout>
  );
};
