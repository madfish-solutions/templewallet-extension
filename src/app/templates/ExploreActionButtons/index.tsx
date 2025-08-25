import React, { memo, FunctionComponent, SVGProps, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import { ChainIds } from '@taquito/taquito';
import clsx from 'clsx';
import { Props as TippyProps } from 'tippy.js';

import { Anchor, IconBase } from 'app/atoms';
import { ReactComponent as ActivityIcon } from 'app/icons/base/activity.svg';
import { ReactComponent as MarketIcon } from 'app/icons/base/card.svg';
import { ReactComponent as ReceiveIcon } from 'app/icons/base/income.svg';
import { ReactComponent as OutcomeIcon } from 'app/icons/base/outcome.svg';
import { ReactComponent as SendIcon } from 'app/icons/base/send.svg';
import { ReactComponent as SwapIcon } from 'app/icons/base/swap.svg';
import { buildSendPagePath } from 'app/pages/Send/build-url';
import { buildSwapPagePath } from 'app/pages/Swap/build-url-query';
import { useLifiSupportedChainIdsSelector } from 'app/store/evm/swap-lifi-metadata/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { TestIDProps } from 'lib/analytics';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { TID, T, t } from 'lib/i18n';
import { useAvailableRoute3TokensSlugs } from 'lib/route3/assets';
import { TempleAccountType } from 'lib/temple/types';
import useTippy from 'lib/ui/useTippy';
import { createUrl, Link, To } from 'lib/woozie';
import { createLocationState } from 'lib/woozie/location';
import { useAccount } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { ExploreActionButtonsSelectors } from './selectors';

interface Props {
  chainKind?: string | nullish;
  chainId?: number | string | nullish;
  assetSlug?: string | nullish;
  additionalButtonType?: 'activity' | 'earn-tez' | 'earn-tkey';
  className?: string;
}

export const ExploreActionButtonsBar = memo<Props>(
  ({ chainKind, chainId, assetSlug, additionalButtonType, className }) => {
    const account = useAccount();
    const testnetModeEnabled = useTestnetModeEnabledSelector();
    const { route3tokensSlugs } = useAvailableRoute3TokensSlugs();
    const supportedChainIds = useLifiSupportedChainIdsSelector();

    const canSend = account.type !== TempleAccountType.WatchOnly;
    const sendLink = buildSendPagePath(chainKind, chainId as string, assetSlug);
    const swapLink = buildSwapPagePath({ chainKind, chainId: chainId as string, assetSlug });

    const isTokenAvailableForSwap = useMemo(() => {
      if (chainKind === TempleChainKind.Tezos) {
        return (
          isDefined(assetSlug) &&
          chainId === ChainIds.MAINNET &&
          (route3tokensSlugs.includes(assetSlug) || assetSlug === TEZ_TOKEN_SLUG)
        );
      }
      if (chainKind === TempleChainKind.EVM && chainId) {
        return isDefined(assetSlug) && supportedChainIds.includes(+chainId);
      }
      return false;
    }, [assetSlug, chainId, chainKind, route3tokensSlugs, supportedChainIds]);

    const labelClassName = additionalButtonType ? 'max-w-12' : 'max-w-15';

    const additionalButton = useMemo(() => {
      switch (additionalButtonType) {
        case 'earn-tez':
        case 'earn-tkey':
          return (
            <ActionButton
              labelI18nKey="earn"
              Icon={OutcomeIcon}
              to={additionalButtonType === 'earn-tez' ? `/earn-tez/${chainId}` : '/earn-tkey'}
              testID={ExploreActionButtonsSelectors.earnButton}
              labelClassName={labelClassName}
            />
          );
        case 'activity':
          return (
            <ActionButton
              labelI18nKey="activity"
              Icon={ActivityIcon}
              to="/activity"
              testID={ExploreActionButtonsSelectors.activityButton}
              labelClassName={labelClassName}
            />
          );
        default:
          return null;
      }
    }, [additionalButtonType, chainId, labelClassName]);

    return (
      <div className={clsx('grid gap-x-2 h-13.5', additionalButton ? 'grid-cols-5' : 'grid-cols-4', className)}>
        <ActionButton
          labelI18nKey="receive"
          Icon={ReceiveIcon}
          to={chainKind ? `/receive/${chainKind}` : '/receive'}
          testID={ExploreActionButtonsSelectors.receiveButton}
          labelClassName={labelClassName}
        />

        <ActionButton
          labelI18nKey="market"
          Icon={MarketIcon}
          to="/market"
          disabled={!canSend || testnetModeEnabled}
          tippyProps={getDisabledTippyProps(testnetModeEnabled)}
          testID={ExploreActionButtonsSelectors.marketButton}
          labelClassName={labelClassName}
        />

        <ActionButton
          labelI18nKey="swap"
          Icon={SwapIcon}
          to={
            isTokenAvailableForSwap
              ? swapLink
              : {
                  pathname: '/swap',
                  search: undefined
                }
          }
          disabled={!canSend || testnetModeEnabled}
          tippyProps={getDisabledTippyProps(testnetModeEnabled)}
          testID={ExploreActionButtonsSelectors.swapButton}
          labelClassName={labelClassName}
        />

        {additionalButton}

        <ActionButton
          labelI18nKey="send"
          Icon={SendIcon}
          to={sendLink}
          disabled={!canSend}
          tippyProps={getDisabledTippyProps(false)}
          testID={ExploreActionButtonsSelectors.sendButton}
          labelClassName={labelClassName}
        />
      </div>
    );
  }
);

interface ActionButtonProps extends TestIDProps {
  labelI18nKey: TID;
  Icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  to: To;
  disabled?: boolean;
  isAnchor?: boolean;
  tippyProps?: Partial<TippyProps>;
  labelClassName?: string;
}

const ActionButton = memo<ActionButtonProps>(
  ({ labelI18nKey, Icon, to, disabled, isAnchor, tippyProps = {}, testID, testIDProperties, labelClassName }) => {
    const buttonRef = useTippy<HTMLButtonElement>({
      ...tippyProps,
      content: disabled && !tippyProps.content ? t('disabled') : tippyProps.content
    });

    const commonButtonProps = useMemo(
      () => ({
        className: clsx(
          'flex flex-col gap-y-0.5 p-2 items-center justify-center rounded-lg',
          disabled
            ? 'bg-disable text-grey-2'
            : 'bg-primary-low text-primary hover:bg-primary-hover-low hover:text-primary-hover'
        ),
        type: 'button' as const,
        children: (
          <>
            <IconBase Icon={Icon} size={24} />

            <span className={clsx('text-font-small-bold truncate', labelClassName)}>
              <T id={labelI18nKey} />
            </span>
          </>
        )
      }),
      [disabled, Icon, labelClassName, labelI18nKey]
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
  }
);

const getDisabledTippyProps = (testnetMode: boolean) => ({
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t(testnetMode ? 'disabledInTestnetMode' : 'disabledForWatchOnlyAccount'),
  animation: 'shift-away-subtle'
});
