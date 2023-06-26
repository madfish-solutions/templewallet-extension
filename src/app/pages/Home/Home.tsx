import React, { FC, FunctionComponent, SVGProps, useEffect, useLayoutEffect, useMemo } from 'react';

import classNames from 'clsx';
import { useDispatch } from 'react-redux';
import { Props as TippyProps } from 'tippy.js';

import { Anchor } from 'app/atoms';
import { useAppEnv } from 'app/env';
import { ReactComponent as BuyIcon } from 'app/icons/buy.svg';
import { ReactComponent as ReceiveIcon } from 'app/icons/receive.svg';
import { ReactComponent as SendIcon } from 'app/icons/send-alt.svg';
import { ReactComponent as SwapIcon } from 'app/icons/swap.svg';
import { ReactComponent as WithdrawIcon } from 'app/icons/withdraw.svg';
import PageLayout from 'app/layouts/PageLayout';
import { TestIDProps } from 'lib/analytics';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { T, t } from 'lib/i18n';
import { useAssetMetadata, getAssetSymbol } from 'lib/metadata';
import { useAccount, useNetwork } from 'lib/temple/front';
import { TempleAccountType, TempleNetworkType } from 'lib/temple/types';
import useTippy from 'lib/ui/useTippy';
import { createUrl, HistoryAction, Link, navigate, To, useLocation } from 'lib/woozie';
import { createLocationState } from 'lib/woozie/location';

import { togglePartnersPromotionAction } from '../../store/partners-promotion/actions';
import { useIsEnabledAdsBannerSelector } from '../../store/settings/selectors';
import { useOnboardingProgress } from '../Onboarding/hooks/useOnboardingProgress.hook';
import Onboarding from '../Onboarding/Onboarding';
import { ContentSection } from './ContentSection';
import { HomeSelectors } from './Home.selectors';
import EditableTitle from './OtherComponents/EditableTitle';
import MainBanner from './OtherComponents/MainBanner';

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

const Home: FC<ExploreProps> = ({ assetSlug }) => {
  const { fullPage, registerBackHandler } = useAppEnv();
  const { onboardingCompleted } = useOnboardingProgress();
  const account = useAccount();
  const { search } = useLocation();
  const network = useNetwork();
  const dispatch = useDispatch();

  const isEnabledAdsBanner = useIsEnabledAdsBannerSelector();

  const assetMetadata = useAssetMetadata(assetSlug || TEZ_TOKEN_SLUG);

  useLayoutEffect(() => {
    const usp = new URLSearchParams(search);
    if (assetSlug && usp.get('after_token_added') === 'true') {
      return registerBackHandler(() => {
        navigate('/', HistoryAction.Replace);
      });
    }
    return undefined;
  }, [registerBackHandler, assetSlug, search]);

  useEffect(() => {
    if (isEnabledAdsBanner) {
      dispatch(togglePartnersPromotionAction(false));
    }
  }, [isEnabledAdsBanner]);

  const accountPkh = account.publicKeyHash;
  const canSend = account.type !== TempleAccountType.WatchOnly;
  const sendLink = assetSlug ? `/send/${assetSlug}` : '/send';

  return onboardingCompleted ? (
    <PageLayout
      pageTitle={
        <>
          {assetSlug && (
            <>
              <span className="font-normal">{getAssetSymbol(assetMetadata)}</span>
            </>
          )}
        </>
      }
      attention={true}
      adShow
    >
      {fullPage && (
        <div className="w-full max-w-sm mx-auto">
          <EditableTitle />
          <hr className="mb-4" />
        </div>
      )}

      <div className="flex flex-col items-center mb-6">
        <MainBanner accountPkh={accountPkh} assetSlug={assetSlug} />

        <div className="flex justify-between mx-auto w-full max-w-sm">
          <ActionButton
            label={<T id="receive" />}
            Icon={ReceiveIcon}
            to="/receive"
            testID={HomeSelectors.receiveButton}
          />

          <ActionButton
            label={<T id="buyButton" />}
            Icon={BuyIcon}
            to={network.type === 'dcp' ? 'https://buy.chainbits.com' : '/buy'}
            isAnchor={network.type === 'dcp'}
            disabled={!NETWORK_TYPES_WITH_BUY_BUTTON.includes(network.type)}
            testID={HomeSelectors.buyButton}
          />
          <ActionButton
            label={<T id="swap" />}
            Icon={SwapIcon}
            to={{
              pathname: '/swap',
              search: `from=${assetSlug ?? ''}`
            }}
            disabled={!canSend}
            tippyProps={tippyPropsMock}
            testID={HomeSelectors.swapButton}
          />
          <ActionButton
            label={<T id="withdraw" />}
            Icon={WithdrawIcon}
            to="/withdraw"
            disabled={!canSend || network.type !== 'main'}
            testID={HomeSelectors.withdrawButton}
          />
          <ActionButton
            label={<T id="send" />}
            Icon={SendIcon}
            to={sendLink}
            disabled={!canSend}
            tippyProps={tippyPropsMock}
            testID={HomeSelectors.sendButton}
          />
        </div>
      </div>

      <ContentSection assetSlug={assetSlug} />
    </PageLayout>
  ) : (
    <Onboarding />
  );
};

export default Home;

interface ActionButtonProps extends TestIDProps {
  label: React.ReactNode;
  Icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  to: To;
  disabled?: boolean;
  isAnchor?: boolean;
  tippyProps?: Partial<TippyProps>;
}

const ActionButton: FC<ActionButtonProps> = ({
  label,
  Icon,
  to,
  disabled,
  isAnchor,
  tippyProps = {},
  testID,
  testIDProperties
}) => {
  const buttonRef = useTippy<HTMLButtonElement>({
    ...tippyProps,
    content: disabled && !tippyProps.content ? t('disabled') : tippyProps.content
  });
  const commonButtonProps = useMemo(
    () => ({
      className: `flex flex-col items-center`,
      type: 'button' as const,
      children: (
        <>
          <div
            className={classNames(
              disabled ? 'bg-gray-10' : 'bg-orange-10',
              'rounded mb-2 flex items-center text-white',
              'p-2 h-10'
            )}
          >
            <Icon className={classNames('w-6 h-auto', disabled ? 'stroke-gray' : 'stroke-accent-orange')} />
          </div>
          <span
            style={{ fontSize: 11 }}
            className={classNames('text-center', disabled ? 'text-gray-20' : 'text-gray-910')}
          >
            {label}
          </span>
        </>
      )
    }),
    [disabled, Icon, label]
  );

  if (disabled) {
    return <button ref={buttonRef} {...commonButtonProps} />;
  }

  if (isAnchor) {
    let href: string;
    if (typeof to === 'string') {
      href = to;
    } else {
      const { pathname, search, hash } = typeof to === 'function' ? to(createLocationState()) : to;
      href = createUrl(pathname, search, hash);
    }

    return <Anchor testID={testID} testIDProperties={testIDProperties} href={href} {...commonButtonProps} />;
  }

  return <Link testID={testID} testIDProperties={testIDProperties} to={to} {...commonButtonProps} />;
};
