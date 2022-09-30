import React, { FC, FunctionComponent, ReactNode, Suspense, SVGProps, useLayoutEffect, useMemo } from 'react';

import classNames from 'clsx';
import { Props as TippyProps } from 'tippy.js';

import Spinner from 'app/atoms/Spinner/Spinner';
import { useTabSlug } from 'app/atoms/useTabSlug';
import { useAppEnv } from 'app/env';
import ErrorBoundary from 'app/ErrorBoundary';
import { ReactComponent as BuyIcon } from 'app/icons/buy.svg';
import { ReactComponent as ChevronRightIcon } from 'app/icons/chevron-right.svg';
import { ReactComponent as ExploreIcon } from 'app/icons/explore.svg';
import { ReactComponent as ReceiveIcon } from 'app/icons/receive.svg';
import { ReactComponent as SendIcon } from 'app/icons/send-alt.svg';
import { ReactComponent as SwapIcon } from 'app/icons/swap.svg';
import PageLayout from 'app/layouts/PageLayout';
import Activity from 'app/templates/activity/Activity';
import AssetInfo from 'app/templates/AssetInfo';
import { TestIDProps } from 'lib/analytics';
import { T, t } from 'lib/i18n/react';
import { PropsWithChildren } from 'lib/props-with-children';
import { isTezAsset } from 'lib/temple/assets';
import { useAccount, useNetwork, useAssetMetadata } from 'lib/temple/front';
import { getAssetSymbol } from 'lib/temple/metadata';
import { TempleAccountType, TempleNetworkType } from 'lib/temple/types';
import useTippy from 'lib/ui/useTippy';
import { HistoryAction, Link, navigate, To, useLocation } from 'lib/woozie';

import { DonationBanner } from '../atoms/DonationBanner';
import CollectiblesList from './Collectibles/CollectiblesList';
import { ExploreSelectors } from './Explore.selectors';
import AddressChip from './Explore/AddressChip';
import BakingSection from './Explore/BakingSection';
import EditableTitle from './Explore/EditableTitle';
import MainBanner from './Explore/MainBanner';
import Tokens from './Explore/Tokens/Tokens';
import { useOnboardingProgress } from './Onboarding/hooks/useOnboardingProgress.hook';
import Onboarding from './Onboarding/Onboarding';

type ExploreProps = {
  assetSlug?: string | null;
};

const tippyPropsMock = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('disabledForWatchOnlyAccount'),
  animation: 'shift-away-subtle'
};

const NETWORK_TYPES_WITH_BUY_BUTTON: TempleNetworkType[] = ['main', 'dcp'];

const Explore: FC<ExploreProps> = ({ assetSlug }) => {
  const { fullPage, registerBackHandler } = useAppEnv();
  const { onboardingCompleted } = useOnboardingProgress();
  const account = useAccount();
  const { search } = useLocation();
  const network = useNetwork();

  const assetMetadata = useAssetMetadata(assetSlug ?? 'tez');

  useLayoutEffect(() => {
    const usp = new URLSearchParams(search);
    if (assetSlug && usp.get('after_token_added') === 'true') {
      return registerBackHandler(() => {
        navigate('/', HistoryAction.Replace);
      });
    }
    return undefined;
  }, [registerBackHandler, assetSlug, search]);

  const accountPkh = account.publicKeyHash;
  const canSend = account.type !== TempleAccountType.WatchOnly;
  const fullpageClassName = fullPage ? 'mb-10' : 'mb-6';
  const sendLink = assetSlug ? `/send/${assetSlug}` : '/send';

  return onboardingCompleted ? (
    <PageLayout
      pageTitle={
        <>
          <ExploreIcon className="w-auto h-4 mr-1 stroke-current" />
          <T id="explore" />
          {assetSlug && (
            <>
              <ChevronRightIcon className="w-auto h-4 mx-px stroke-current opacity-75" />
              <span className="font-normal">{getAssetSymbol(assetMetadata)}</span>
            </>
          )}
        </>
      }
      attention={true}
    >
      <DonationBanner />

      {fullPage && (
        <>
          <EditableTitle />
          <hr className="mb-6" />
        </>
      )}

      <div className={classNames('flex flex-col items-center', fullpageClassName)}>
        <AddressChip pkh={accountPkh} className="mb-6" />

        <MainBanner accountPkh={accountPkh} assetSlug={assetSlug} />

        <div className="flex justify-between mx-auto w-full max-w-sm mt-6 px-8">
          <ActionButton
            label={<T id="receive" />}
            Icon={ReceiveIcon}
            to="/receive"
            testID={ExploreSelectors.ReceiveButton}
          />
          {NETWORK_TYPES_WITH_BUY_BUTTON.includes(network.type) && (
            <ActionButton
              label={<T id="buyButton" />}
              Icon={BuyIcon}
              to={`/buy?tab=${network.type === 'dcp' ? 'debit' : 'crypto'}`}
              testID={ExploreSelectors.BuyButton}
            />
          )}

          <ActionButton
            label={<T id="swap" />}
            Icon={SwapIcon}
            to={{
              pathname: '/swap',
              search: `from=${assetSlug ?? ''}`
            }}
            disabled={!canSend}
            tippyProps={tippyPropsMock}
            testID={ExploreSelectors.SwapButton}
          />
          <ActionButton
            label={<T id="send" />}
            Icon={SendIcon}
            to={sendLink}
            disabled={!canSend}
            tippyProps={tippyPropsMock}
            testID={ExploreSelectors.SendButton}
          />
        </div>
      </div>

      <SecondarySection assetSlug={assetSlug} />
    </PageLayout>
  ) : (
    <Onboarding />
  );
};

export default Explore;

interface ActionButtonProps extends TestIDProps {
  label: React.ReactNode;
  Icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  to: To;
  disabled?: boolean;
  tippyProps?: Partial<TippyProps>;
}

const ActionButton: FC<ActionButtonProps> = ({
  label,
  Icon,
  to,
  disabled,
  tippyProps = {},
  testID,
  testIDProperties
}) => {
  const buttonRef = useTippy<HTMLButtonElement>(tippyProps);
  const commonButtonProps = useMemo(
    () => ({
      className: `flex flex-col items-center`,
      type: 'button' as const,
      children: (
        <>
          <div
            className={classNames(
              disabled ? 'bg-blue-300' : 'bg-blue-500',
              'rounded mb-1 flex items-center text-white'
            )}
            style={{ padding: '0 0.625rem', height: '2.75rem' }}
          >
            <Icon className="w-6 h-auto stroke-current" />
          </div>
          <span className={classNames('text-xs text-center', disabled ? 'text-blue-300' : 'text-blue-500')}>
            {label}
          </span>
        </>
      )
    }),
    [disabled, Icon, label]
  );
  return disabled ? (
    <button ref={buttonRef} {...commonButtonProps} />
  ) : (
    <Link testID={testID} testIDProperties={testIDProperties} to={to} {...commonButtonProps} />
  );
};

const Delegation: FC = () => (
  <SuspenseContainer whileMessage={t('delegationInfoWhileMessage')}>
    <BakingSection />
  </SuspenseContainer>
);

type ActivityTabProps = {
  assetSlug?: string;
};

const ActivityTab: FC<ActivityTabProps> = ({ assetSlug }) => {
  const account = useAccount();

  return (
    <SuspenseContainer whileMessage={t('operationHistoryWhileMessage')}>
      <Activity address={account.publicKeyHash} assetSlug={assetSlug} />
    </SuspenseContainer>
  );
};

type SecondarySectionProps = {
  assetSlug?: string | null;
  className?: string;
};

const SecondarySection: FC<SecondarySectionProps> = ({ assetSlug, className }) => {
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
    if (!assetSlug) {
      return [
        {
          slug: 'tokens',
          title: t('tokens'),
          Component: Tokens,
          testID: ExploreSelectors.AssetsTab
        },
        {
          slug: 'collectibles',
          title: t('collectibles'),
          Component: CollectiblesList,
          testID: ExploreSelectors.CollectiblesTab
        },
        {
          slug: 'activity',
          title: t('activity'),
          Component: ActivityTab,
          testID: ExploreSelectors.ActivityTab
        }
      ];
    }

    const activity = {
      slug: 'activity',
      title: t('activity'),
      Component: () => <ActivityTab assetSlug={assetSlug} />,
      testID: ExploreSelectors.ActivityTab
    };

    const info = {
      slug: 'info',
      title: t('info'),
      Component: () => <AssetInfo assetSlug={assetSlug} />,
      testID: ExploreSelectors.AboutTab
    };

    if (isTezAsset(assetSlug)) {
      return [
        activity,
        {
          slug: 'delegation',
          title: t('delegate'),
          Component: Delegation,
          testID: ExploreSelectors.DelegationTab
        }
      ];
    }

    return [activity, info];
  }, [assetSlug]);

  const { slug, Component } = useMemo(() => {
    const tab = tabSlug ? tabs.find(currentTab => currentTab.slug === tabSlug) : null;
    return tab ?? tabs[0];
  }, [tabSlug, tabs]);

  return (
    <div className={classNames('-mx-4', 'shadow-top-light', fullPage && 'rounded-t-md', className)}>
      <div className={classNames('w-full max-w-sm mx-auto px-10', 'flex items-center justify-center')}>
        {tabs.map(currentTab => {
          const active = slug === currentTab.slug;

          return (
            <Link
              key={assetSlug ? `asset_${currentTab.slug}` : currentTab.slug}
              to={lctn => ({ ...lctn, search: `?tab=${currentTab.slug}` })}
              replace
              className={classNames(
                'flex1 w-full',
                'text-center cursor-pointer mb-1 pb-1 pt-2',
                'text-gray-500 text-xs font-medium',
                'border-t-2',
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
