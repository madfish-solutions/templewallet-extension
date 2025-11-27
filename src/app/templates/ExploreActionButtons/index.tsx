import React, { memo, FunctionComponent, SVGProps, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import { ChainIds } from '@taquito/taquito';
import clsx from 'clsx';
import { Props as TippyProps } from 'tippy.js';

import { Button, IconBase } from 'app/atoms';
import { ReactComponent as ActivityIcon } from 'app/icons/base/activity.svg';
import { ReactComponent as DepositIcon } from 'app/icons/base/income.svg';
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
import { Link, To } from 'lib/woozie';
import { useAccount } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { ExploreActionButtonsSelectors } from './selectors';

interface Props {
  chainKind?: string | nullish;
  chainId?: number | string | nullish;
  assetSlug?: string | nullish;
  additionalButtonType?: 'activity' | 'earn-tez' | 'earn-tkey' | 'earn-eth';
  onDepositClick?: EmptyFn;
  className?: string;
}

export const ExploreActionButtonsBar = memo<Props>(
  ({ chainKind, chainId, assetSlug, additionalButtonType, onDepositClick, className }) => {
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

    const additionalButton = useMemo(() => {
      switch (additionalButtonType) {
        case 'earn-tez':
        case 'earn-tkey':
        case 'earn-eth':
          return (
            <ActionButton
              labelI18nKey="earn"
              Icon={OutcomeIcon}
              to={additionalButtonType === 'earn-tez' ? `/earn-tez/${chainId}` : `/${additionalButtonType}`}
              testID={ExploreActionButtonsSelectors.earnButton}
            />
          );
        case 'activity':
          return (
            <ActionButton
              labelI18nKey="activity"
              Icon={ActivityIcon}
              to="/activity"
              testID={ExploreActionButtonsSelectors.activityButton}
            />
          );
        default:
          return null;
      }
    }, [additionalButtonType, chainId]);

    // For home page (activity button), show: Deposit, Swap, Activity, Send
    // For token page with earn, show: Deposit, Swap, Earn, Send
    return (
      <div className={clsx('flex gap-3', className)}>
        <DepositActionButton onClick={onDepositClick} testID={ExploreActionButtonsSelectors.depositButton} />

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
        />

        {additionalButton}

        <ActionButton
          labelI18nKey="send"
          Icon={SendIcon}
          to={sendLink}
          disabled={!canSend}
          tippyProps={getDisabledTippyProps(false)}
          testID={ExploreActionButtonsSelectors.sendButton}
        />
      </div>
    );
  }
);

interface DepositActionButtonProps extends TestIDProps {
  onClick?: EmptyFn;
}

const DepositActionButton = memo<DepositActionButtonProps>(({ onClick, testID, testIDProperties }) => (
  <Button
    className={clsx(
      'flex-1 flex flex-col gap-0.5 p-2 items-center justify-center rounded-lg',
      'bg-primary-low text-primary hover:bg-primary-hover-low hover:text-primary-hover'
    )}
    onClick={onClick}
    testID={testID}
    testIDProperties={testIDProperties}
  >
    <IconBase Icon={DepositIcon} size={24} />
    <span className="text-font-small-bold">
      <T id="deposit" />
    </span>
  </Button>
));

interface ActionButtonProps extends TestIDProps {
  labelI18nKey: TID;
  Icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  to: To;
  disabled?: boolean;
  tippyProps?: Partial<TippyProps>;
}

const ActionButton = memo<ActionButtonProps>(
  ({ labelI18nKey, Icon, to, disabled, tippyProps = {}, testID, testIDProperties }) => {
    const buttonRef = useTippy<HTMLButtonElement>({
      ...tippyProps,
      content: disabled && !tippyProps.content ? t('disabled') : tippyProps.content
    });

    const commonButtonProps = useMemo(
      () => ({
        className: clsx(
          'flex-1 flex flex-col gap-0.5 p-2 items-center justify-center rounded-lg',
          disabled
            ? 'bg-disable text-grey-2'
            : 'bg-primary-low text-primary hover:bg-primary-hover-low hover:text-primary-hover'
        ),
        type: 'button' as const,
        children: (
          <>
            <IconBase Icon={Icon} size={24} />
            <span className="text-font-small-bold">
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

    return <Link testID={testID} testIDProperties={testIDProperties} to={to} {...commonButtonProps} />;
  }
);

const getDisabledTippyProps = (testnetMode: boolean) => ({
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t(testnetMode ? 'disabledInTestnetMode' : 'disabledForWatchOnlyAccount'),
  animation: 'shift-away-subtle'
});
