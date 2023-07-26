import React, { FC, ReactNode, Suspense, useCallback, useMemo, useRef } from 'react';

import clsx from 'clsx';

import Spinner from 'app/atoms/Spinner/Spinner';
import { useTabSlug } from 'app/atoms/useTabSlug';
import { useAppEnv } from 'app/env';
import ErrorBoundary from 'app/ErrorBoundary';
import { ToolbarElement } from 'app/layouts/PageLayout';
import { ActivityComponent } from 'app/templates/activity/Activity';
import AssetInfo from 'app/templates/AssetInfo';
import { TabsBar } from 'app/templates/TabBar';
import { isTezAsset } from 'lib/assets';
import { t, TID } from 'lib/i18n';

import { useUserTestingGroupNameSelector } from '../../store/ab-testing/selectors';
import { CollectiblesTab } from '../Collectibles/components/CollectiblesTab';
import { HomeSelectors } from './Home.selectors';
import BakingSection from './OtherComponents/BakingSection';
import { TokensTab } from './OtherComponents/Tokens/Tokens';

type Props = {
  assetSlug?: string | null;
  className?: string;
};

type TabName = 'tokens' | 'collectibles' | 'activity' | 'delegation' | 'info';

interface TabData {
  name: TabName;
  titleI18nKey: TID;
  Component: FC;
  testID: string;
  whileMessageI18nKey?: TID;
}

export const ContentSection: FC<Props> = ({ assetSlug, className }) => {
  const { fullPage } = useAppEnv();
  const tabSlug = useTabSlug();

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
          name: 'tokens',
          titleI18nKey: 'tokens',
          Component: TokensTab,
          testID: HomeSelectors.assetsTab
        },
        {
          name: 'collectibles',
          titleI18nKey: 'collectibles',
          Component: () => <CollectiblesTab scrollToTheTabsBar={scrollToTheTabsBar} />,
          testID: HomeSelectors.collectiblesTab
        },
        {
          name: 'activity',
          titleI18nKey: 'activity',
          Component: ActivityComponent,
          testID: HomeSelectors.activityTab,
          whileMessageI18nKey: 'operationHistoryWhileMessage'
        }
      ];
    }

    const activity: TabData = {
      name: 'activity',
      titleI18nKey: 'activity',
      Component: () => <ActivityComponent assetSlug={assetSlug} />,
      testID: HomeSelectors.activityTab
    };

    if (isTezAsset(assetSlug)) {
      return [
        activity,
        {
          name: 'delegation',
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
        name: 'info',
        titleI18nKey: 'info',
        Component: () => <AssetInfo assetSlug={assetSlug} />,
        testID: HomeSelectors.aboutTab
      }
    ];
  }, [assetSlug, scrollToTheTabsBar]);

  const { name, Component, whileMessageI18nKey } = useMemo(() => {
    const tab = tabSlug ? tabs.find(currentTab => currentTab.name === tabSlug) : null;
    return tab ?? tabs[0];
  }, [tabSlug, tabs]);

  return (
    <div className={clsx('-mx-4 shadow-top-light', fullPage && 'rounded-t-md', className)}>
      <TabsBar ref={tabBarElemRef} tabs={tabs} activeTabName={name} />

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
