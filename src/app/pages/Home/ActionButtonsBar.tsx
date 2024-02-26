import React, { memo, FunctionComponent, SVGProps, useMemo } from 'react';

import clsx from 'clsx';
import { Props as TippyProps } from 'tippy.js';

import { Anchor } from 'app/atoms';
import { ReactComponent as BuyIcon } from 'app/icons/buy.svg';
import { ReactComponent as ReceiveIcon } from 'app/icons/receive.svg';
import { ReactComponent as SendIcon } from 'app/icons/send-alt.svg';
import { ReactComponent as SwapIcon } from 'app/icons/swap.svg';
import { ReactComponent as WithdrawIcon } from 'app/icons/withdraw.svg';
import { buildSwapPageUrlQuery } from 'app/pages/Swap/utils/build-url-query';
import { TestIDProps } from 'lib/analytics';
import { TID, T, t } from 'lib/i18n';
import { useAccount, useNetwork } from 'lib/temple/front';
import { TempleAccountType, TempleNetworkType } from 'lib/temple/types';
import useTippy from 'lib/ui/useTippy';
import { createUrl, Link, To } from 'lib/woozie';
import { createLocationState } from 'lib/woozie/location';

import { HomeSelectors } from './Home.selectors';

const tippyPropsMock = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('disabledForWatchOnlyAccount'),
  animation: 'shift-away-subtle'
};

const NETWORK_TYPES_WITH_BUY_BUTTON: TempleNetworkType[] = ['main', 'dcp'];

interface Props {
  assetSlug: string | nullish;
}

export const ActionButtonsBar = memo<Props>(({ assetSlug }) => {
  const account = useAccount();
  const network = useNetwork();

  const canSend = account.type !== TempleAccountType.WatchOnly;
  const sendLink = assetSlug ? `/send/${assetSlug}` : '/send';

  const swapLink = useMemo(
    () => ({
      pathname: '/swap',
      search: buildSwapPageUrlQuery(assetSlug)
    }),
    [assetSlug]
  );

  return (
    <div className="flex justify-between mx-auto w-full max-w-sm">
      <ActionButton labelI18nKey="receive" Icon={ReceiveIcon} to="/receive" testID={HomeSelectors.receiveButton} />

      <ActionButton
        labelI18nKey="buyButton"
        Icon={BuyIcon}
        to={network.type === 'dcp' ? 'https://buy.chainbits.com' : '/buy'}
        isAnchor={network.type === 'dcp'}
        disabled={!NETWORK_TYPES_WITH_BUY_BUTTON.includes(network.type)}
        testID={HomeSelectors.buyButton}
      />
      <ActionButton
        labelI18nKey="swap"
        Icon={SwapIcon}
        to={swapLink}
        disabled={!canSend}
        tippyProps={tippyPropsMock}
        testID={HomeSelectors.swapButton}
      />
      <ActionButton
        labelI18nKey="withdraw"
        Icon={WithdrawIcon}
        to="/withdraw"
        disabled={!canSend || network.type !== 'main'}
        testID={HomeSelectors.withdrawButton}
      />
      <ActionButton
        labelI18nKey="send"
        Icon={SendIcon}
        to={sendLink}
        disabled={!canSend}
        tippyProps={tippyPropsMock}
        testID={HomeSelectors.sendButton}
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
}

const ActionButton = memo<ActionButtonProps>(
  ({ labelI18nKey, Icon, to, disabled, isAnchor, tippyProps = {}, testID, testIDProperties }) => {
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
              className={clsx(
                disabled ? 'bg-gray-10' : 'bg-orange-10',
                'rounded mb-2 flex items-center text-white',
                'p-2 h-10'
              )}
            >
              <Icon className={clsx('w-6 h-auto', disabled ? 'stroke-gray' : 'stroke-accent-orange')} />
            </div>

            <span className={clsx('text-center text-xxs', disabled ? 'text-gray-20' : 'text-gray-910')}>
              <T id={labelI18nKey} />
            </span>
          </>
        )
      }),
      [disabled, Icon, labelI18nKey]
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
