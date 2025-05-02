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
import { buildSwapPageUrlQuery } from 'app/pages/Swap/build-url-query';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { TestIDProps } from 'lib/analytics';
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
  chainId?: string | nullish;
  assetSlug?: string | nullish;
  activityBtn?: 'activity' | 'earn-tez';
  className?: string;
}

export const ExploreActionButtonsBar = memo<Props>(({ chainKind, chainId, assetSlug, activityBtn, className }) => {
  const account = useAccount();
  const testnetModeEnabled = useTestnetModeEnabledSelector();
  const { route3tokensSlugs } = useAvailableRoute3TokensSlugs();

  const canSend = account.type !== TempleAccountType.WatchOnly;
  const sendLink = buildSendPagePath(chainKind, chainId, assetSlug);

  const isTokenAvailableForSwap = useMemo(() => {
    return (
      isDefined(assetSlug) &&
      chainKind === TempleChainKind.Tezos &&
      chainId === ChainIds.MAINNET &&
      route3tokensSlugs.includes(assetSlug)
    );
  }, [assetSlug, chainId, chainKind, route3tokensSlugs]);

  const swapLink = useMemo(
    () => ({
      pathname: '/swap',
      search: isTokenAvailableForSwap ? buildSwapPageUrlQuery(assetSlug) : undefined
    }),
    [isTokenAvailableForSwap, assetSlug]
  );

  const labelClassName = useMemo(() => (activityBtn ? 'max-w-12' : 'max-w-15'), [activityBtn]);

  return (
    <div className={clsx('flex justify-between gap-x-2 h-13.5', className)}>
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
        to={swapLink}
        disabled={!canSend || testnetModeEnabled}
        tippyProps={getDisabledTippyProps(testnetModeEnabled)}
        testID={ExploreActionButtonsSelectors.swapButton}
        labelClassName={labelClassName}
      />

      {activityBtn === 'earn-tez' ? (
        <ActionButton
          labelI18nKey="earn"
          Icon={OutcomeIcon}
          to={`/earn-tez/${chainId}`}
          testID={ExploreActionButtonsSelectors.earnButton}
          labelClassName={labelClassName}
        />
      ) : (
        activityBtn === 'activity' && (
          <ActionButton
            labelI18nKey="activity"
            Icon={ActivityIcon}
            to="/activity"
            testID={ExploreActionButtonsSelectors.activityButton}
            labelClassName={labelClassName}
          />
        )
      )}

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
});

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
          'flex-1 flex flex-col gap-y-0.5 p-2 items-center justify-center rounded-lg',
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
