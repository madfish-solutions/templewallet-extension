import React, { FC, ReactNode, Suspense, useCallback, useMemo, useRef } from 'react';

import clsx from 'clsx';

import Spinner from 'app/atoms/Spinner/Spinner';
import { useTabSlug } from 'app/atoms/useTabSlug';
import { useAppEnv } from 'app/env';
import ErrorBoundary from 'app/ErrorBoundary';
import { ToolbarElement } from 'app/layouts/PageLayout';
import { ActivityComponent } from 'app/templates/activity/Activity';
import AssetInfo from 'app/templates/AssetInfo';
import { ABTestGroup } from 'lib/apis/temple';
import { isTezAsset } from 'lib/assets';
import { T, t, TID } from 'lib/i18n';
import { Link } from 'lib/woozie';

import { useUserTestingGroupNameSelector } from '../../store/ab-testing/selectors';
import { CollectiblesTab } from '../Collectibles/components/CollectiblesTab';
import { HomeSelectors } from './Home.selectors';
import BakingSection from './OtherComponents/BakingSection';
import { TokensTab } from './OtherComponents/Tokens/Tokens';

type Props = {
  assetSlug?: string | null;
  className?: string;
};

type TabSlug = 'tokens' | 'collectibles' | 'activity' | 'delegation' | 'info';

interface TabData {
  slug: TabSlug;
  titleI18nKey: TID;
  Component: FC;
  testID: string;
  whileMessageI18nKey?: TID;
}

export const ContentSection: FC<Props> = ({ assetSlug, className }) => {
  const { fullPage } = useAppEnv();
  const tabSlug = useTabSlug();
  const testGroupName = useUserTestingGroupNameSelector();

  const tabBarElemRef = useRef<HTMLDivElement>(null);

  const scrollToTheTabsBar = useCallback(() => {
    if (!tabBarElemRef.current) return;

    const stickyBarHeight = ToolbarElement?.scrollHeight ?? 0;

    window.scrollTo({
      top: window.pageYOffset + tabBarElemRef.current.getBoundingClientRect().top - stickyBarHeight,
      behavior: 'smooth'
    });
  }, []);

  const tabs = useMemo<TabData[]>(() => {
    if (!assetSlug) {
      return [
        {
          slug: 'tokens',
          titleI18nKey: 'tokens',
          Component: TokensTab,
          testID: HomeSelectors.assetsTab
        },
        {
          slug: 'collectibles',
          titleI18nKey: 'collectibles',
          Component: () => <CollectiblesTab scrollToTheTabsBar={scrollToTheTabsBar} />,
          testID: HomeSelectors.collectiblesTab
        },
        {
          slug: 'activity',
          titleI18nKey: 'activity',
          Component: ActivityComponent,
          testID: HomeSelectors.activityTab,
          whileMessageI18nKey: 'operationHistoryWhileMessage'
        }
      ];
    }

    const activity: TabData = {
      slug: 'activity',
      titleI18nKey: 'activity',
      Component: () => <ActivityComponent assetSlug={assetSlug} />,
      testID: HomeSelectors.activityTab
    };

    if (isTezAsset(assetSlug)) {
      return [
        activity,
        {
          slug: 'delegation',
          titleI18nKey: 'delegate',
          Component: BakingSection,
          testID: HomeSelectors.delegationTab,
          whileMessageI18nKey: 'delegationInfoWhileMessage'
        }
      ];
    }

    return [
      activity,
      {
        slug: 'info',
        titleI18nKey: 'info',
        Component: () => <AssetInfo assetSlug={assetSlug} />,
        testID: HomeSelectors.aboutTab
      }
    ];
  }, [assetSlug, scrollToTheTabsBar]);

  const { slug, Component, whileMessageI18nKey } = useMemo(() => {
    const tab = tabSlug ? tabs.find(currentTab => currentTab.slug === tabSlug) : null;
    return tab ?? tabs[0];
  }, [tabSlug, tabs]);

  return (
    <div className={clsx('-mx-4 shadow-top-light', fullPage && 'rounded-t-md', className)}>
      <div ref={tabBarElemRef} className="w-full max-w-sm mx-auto flex items-center justify-center">
        {tabs.map(tab => (
          <TabButton
            key={assetSlug ? `asset_${tab.slug}` : tab.slug}
            tab={tab}
            active={slug === tab.slug}
            testGroupName={testGroupName}
          />
        ))}
      </div>

      <SuspenseContainer whileMessage={whileMessageI18nKey ? t(whileMessageI18nKey) : 'displaying tab'}>
        {Component && <Component />}
      </SuspenseContainer>
    </div>
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

interface TabButtonProps {
  tab: TabData;
  active: boolean;
  testGroupName: ABTestGroup;
}

const TabButton: FC<TabButtonProps> = ({ tab, active, testGroupName }) => {
  return (
    <Link
      to={lctn => ({ ...lctn, search: `?tab=${tab.slug}` })}
      replace
      className={clsx(
        'flex1 w-full text-center cursor-pointer py-2 border-t-3',
        'text-gray-500 text-xs font-medium truncate',
        'transition ease-in-out duration-300',
        active ? 'border-primary-orange text-primary-orange' : 'border-transparent hover:text-primary-orange'
      )}
      testID={tab.testID}
      testIDProperties={{
        ...(tab.slug === 'delegation' && { abTestingCategory: testGroupName })
      }}
    >
      <T id={tab.titleI18nKey} />
    </Link>
  );
};
