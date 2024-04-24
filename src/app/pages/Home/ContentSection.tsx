import React, { FC, memo, Suspense, useCallback, useMemo, useRef } from 'react';

import Spinner from 'app/atoms/Spinner/Spinner';
import ErrorBoundary from 'app/ErrorBoundary';
import { useLocationSearchParamValue } from 'app/hooks/use-location';
import { ToolbarElement } from 'app/layouts/PageLayout';
import { ActivityTab } from 'app/templates/activity/Activity';
import AssetInfo from 'app/templates/AssetInfo';
import { TabsBar } from 'app/templates/TabBar';
import { isTezAsset } from 'lib/assets';
import { t, TID } from 'lib/i18n';

import { CollectiblesTab } from '../Collectibles/CollectiblesTab';

import { HomeSelectors } from './Home.selectors';
import BakingSection from './OtherComponents/BakingSection';
import { TokensTab } from './OtherComponents/Tokens/Tokens';

interface Props {
  tezosChainId: string | nullish;
  assetSlug?: string | null;
}

type TabName = 'tokens' | 'collectibles' | 'activity' | 'delegation' | 'info';

interface TabData {
  name: TabName;
  titleI18nKey: TID;
  Component: FC;
  testID: string;
  whileMessageI18nKey?: TID;
}

export const ContentSection = memo<Props>(({ tezosChainId, assetSlug }) => {
  const tabSlug = useLocationSearchParamValue('tab');

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
    if (!tezosChainId || !assetSlug) {
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
          Component: ActivityTab,
          testID: HomeSelectors.activityTab,
          whileMessageI18nKey: 'operationHistoryWhileMessage'
        }
      ];
    }

    const activity: TabData = {
      name: 'activity',
      titleI18nKey: 'activity',
      Component: () => <ActivityTab tezosChainId={tezosChainId} assetSlug={assetSlug} />,
      testID: HomeSelectors.activityTab
    };

    if (isTezAsset(assetSlug)) {
      return [
        activity,
        {
          name: 'delegation',
          titleI18nKey: 'delegate',
          Component: () => <BakingSection tezosChainId={tezosChainId} />,
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
        Component: () => <AssetInfo tezosChainId={tezosChainId} assetSlug={assetSlug} />,
        testID: HomeSelectors.infoTab
      }
    ];
  }, [tezosChainId, assetSlug, scrollToTheTabsBar]);

  const { name, Component, whileMessageI18nKey } = useMemo(() => {
    const tab = tabSlug ? tabs.find(currentTab => currentTab.name === tabSlug) : null;
    return tab ?? tabs[0];
  }, [tabSlug, tabs]);

  return (
    <>
      <TabsBar ref={tabBarElemRef} tabs={tabs} activeTabName={name} />

      <ErrorBoundary
        key={tabSlug ?? 'tokens'}
        whileMessage={whileMessageI18nKey ? t(whileMessageI18nKey) : 'displaying tab'}
      >
        <Suspense fallback={<SpinnerSection />}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    </>
  );
});

const SpinnerSection = () => (
  <div className="flex justify-center my-12">
    <Spinner theme="gray" className="w-20" />
  </div>
);
