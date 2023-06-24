import React, { FC, ReactNode, Suspense, useMemo } from 'react';

import classNames from 'clsx';

import Spinner from 'app/atoms/Spinner/Spinner';
import { useTabSlug } from 'app/atoms/useTabSlug';
import { useAppEnv } from 'app/env';
import ErrorBoundary from 'app/ErrorBoundary';
import { ActivityComponent } from 'app/templates/activity/Activity';
import AssetInfo from 'app/templates/AssetInfo';
import { isTezAsset } from 'lib/assets';
import { T, t, TID } from 'lib/i18n';
import { Link } from 'lib/woozie';

import { useUserTestingGroupNameSelector } from '../../store/ab-testing/selectors';
import { CollectiblesTab } from '../Collectibles/CollectiblesTab';
import { HomeSelectors } from './Home.selectors';
import BakingSection from './OtherComponents/BakingSection';
import { TokensTab } from './OtherComponents/Tokens/Tokens';

const Delegation: FC = () => (
  <SuspenseContainer whileMessage={t('delegationInfoWhileMessage')}>
    <BakingSection />
  </SuspenseContainer>
);

type ActivityTabProps = {
  assetSlug?: string;
};

const ActivityTab: FC<ActivityTabProps> = ({ assetSlug }) => (
  <SuspenseContainer whileMessage={t('operationHistoryWhileMessage')}>
    <ActivityComponent assetSlug={assetSlug} />
  </SuspenseContainer>
);

type Props = {
  assetSlug?: string | null;
  className?: string;
};

interface TabData {
  slug: string;
  titleI18nKey: TID;
  Component: FC;
  testID: string;
}

export const ContentSection: FC<Props> = ({ assetSlug, className }) => {
  const { fullPage } = useAppEnv();
  const tabSlug = useTabSlug();
  const testGroupName = useUserTestingGroupNameSelector();

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
          Component: CollectiblesTab,
          testID: HomeSelectors.collectiblesTab
        },
        {
          slug: 'activity',
          titleI18nKey: 'activity',
          Component: ActivityTab,
          testID: HomeSelectors.activityTab
        }
      ];
    }

    const activity: TabData = {
      slug: 'activity',
      titleI18nKey: 'activity',
      Component: () => <ActivityTab assetSlug={assetSlug} />,
      testID: HomeSelectors.activityTab
    };

    if (isTezAsset(assetSlug)) {
      return [
        activity,
        {
          slug: 'delegation',
          titleI18nKey: 'delegate',
          Component: Delegation,
          testID: HomeSelectors.delegationTab
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
  }, [assetSlug]);

  const { slug, Component } = useMemo(() => {
    const tab = tabSlug ? tabs.find(currentTab => currentTab.slug === tabSlug) : null;
    return tab ?? tabs[0];
  }, [tabSlug, tabs]);

  return (
    <div className={classNames('-mx-4 shadow-top-light', fullPage && 'rounded-t-md', className)}>
      <div className="w-full max-w-sm mx-auto flex items-center justify-center">
        {tabs.map(currentTab => {
          const active = slug === currentTab.slug;

          return (
            <Link
              key={assetSlug ? `asset_${currentTab.slug}` : currentTab.slug}
              to={lctn => ({ ...lctn, search: `?tab=${currentTab.slug}` })}
              replace
              className={classNames(
                'flex1 w-full',
                'text-center cursor-pointer py-2',
                'text-gray-500 text-xs font-medium',
                'border-t-3',
                active ? 'border-primary-orange' : 'border-transparent',
                active ? 'text-primary-orange' : 'hover:text-primary-orange',
                'transition ease-in-out duration-300',
                'truncate'
              )}
              testID={currentTab.testID}
              testIDProperties={{
                ...(currentTab.slug === 'delegation' && { abTestingCategory: testGroupName })
              }}
            >
              <T id={currentTab.titleI18nKey} />
            </Link>
          );
        })}
      </div>

      <SuspenseContainer whileMessage="displaying tab">{Component && <Component />}</SuspenseContainer>
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
