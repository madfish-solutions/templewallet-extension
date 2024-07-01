import React, { ComponentType, memo, useMemo } from 'react';

import clsx from 'clsx';

import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useLocationSearchParamValue } from 'app/hooks/use-location';
import { TestIDProperty } from 'lib/analytics';
import { Link } from 'lib/woozie';

import PageLayout from './PageLayout';

export interface TabInterface extends TestIDProperty {
  slug: string;
  title: React.ReactNode;
  Component: ComponentType;
  disabled?: boolean;
  description?: string;
}

interface Props {
  tabs: NonEmptyArray<TabInterface>;
  Icon?: ImportedSVGComponent;
  title: string;
}

export const TabsPageLayout = memo<Props>(({ tabs, Icon, title }) => {
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

      <div className="flex flex-col px-4 pt-6 pb-15">
        <div className="mb-4 text-center text-grey-2">{description}</div>

        <SuspenseContainer errorMessage="displaying tab">
          <Component />
        </SuspenseContainer>
      </div>
    </PageLayout>
  );
});

interface PageTitleProps {
  Icon?: React.ComponentType;
  title: string;
}

const PageTitle = memo<PageTitleProps>(({ Icon, title }) => (
  <div className="flex items-center gap-x-1">
    {Icon && <Icon />}
    <span className="font-normal text-sm">{title}</span>
  </div>
));
