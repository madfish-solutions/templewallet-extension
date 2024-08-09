import React, { ButtonHTMLAttributes, FC, memo, PropsWithChildren, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import { Spinner } from 'app/atoms';
import { Button } from 'app/atoms/Button';
import { TestIDProperty, TestIDProps } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { useConfirm } from 'lib/ui/dialog';
import useTippy from 'lib/ui/useTippy';
import { Link, navigate } from 'lib/woozie';

import ModStyles from './styles.module.css';

interface DelegateButtonProps extends TestIDProperty {
  to: string;
  disabled: boolean;
  small?: boolean;
  slim?: boolean;
  flashing?: boolean;
}

export const DelegateButton: FC<PropsWithChildren<DelegateButtonProps>> = ({
  to,
  disabled,
  small,
  slim = small,
  flashing,
  testID,
  children
}) => {
  const className = useMemo(
    () =>
      clsx(
        getBakingButtonClassName(disabled),
        small ? 'text-xs' : 'text-base',
        slim ? 'min-h-10' : 'min-h-11',
        !disabled && flashing && ModStyles.delegateButton
      ),
    [disabled, small, slim, flashing]
  );

  if (disabled) return <CannotDelegateButton className={className}>{children}</CannotDelegateButton>;

  return (
    <Link to={to} className={className} testID={testID}>
      {children}
    </Link>
  );
};

interface StakeButtonProps extends TestIDProperty {
  type?: ButtonHTMLAttributes<unknown>['type'];
  disabled: boolean;
  loading?: boolean;
  onClick?: EmptyFn;
}

export const StakeButton = memo<StakeButtonProps>(({ type, disabled, loading, testID, onClick }) => {
  const className = useMemo(
    () => clsx(getBakingButtonClassName(disabled, loading), 'min-h-12 text-base'),
    [disabled, loading]
  );

  return (
    <Button type={type} className={className} disabled={disabled} onClick={onClick} testID={testID}>
      {loading ? <Spinner theme="white" className="w-10" /> : <T id="stake" />}
    </Button>
  );
});

interface RedelegateButtonProps extends TestIDProperty {
  chainId: string;
  disabled: boolean;
  staked: boolean;
}

export const RedelegateButton = memo<RedelegateButtonProps>(({ chainId, disabled, staked, testID }) => {
  const className = useMemo(
    () =>
      clsx(
        COMMON_BUTTON_CLASSNAMES,
        'whitespace-nowrap text-xs font-medium bg-gray-200 text-gray-600',
        disabled ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-300'
      ),
    [disabled]
  );

  if (disabled)
    return (
      <CannotDelegateButton className={className}>
        <T id="reDelegate" />
      </CannotDelegateButton>
    );

  if (staked) return <RedelegateButtonWithConfirmation chainId={chainId} className={className} testID={testID} />;

  return (
    <Link to={`/delegate/${chainId}`} className={className} testID={testID}>
      <T id="reDelegate" />
    </Link>
  );
});

interface RedelegateButtonWithConfirmationProps extends PropsWithClassName<TestIDProperty> {
  chainId: string;
}

const RedelegateButtonWithConfirmation = memo<RedelegateButtonWithConfirmationProps>(
  ({ chainId, className, testID }) => {
    const customConfirm = useConfirm();

    const onClick = useCallback(
      () =>
        customConfirm({
          title: 'You have active staking',
          description:
            'After re-delegation, your active stake with current baker will be requested to unstake. New stake will be available after the unstake cooldown period ends.',
          comfirmButtonText: `${t('reDelegate')} & Unstake`,
          stretchButtons: true
        }).then(confirmed => {
          if (confirmed) navigate(`/delegate/${chainId}`);
        }),
      [customConfirm, chainId]
    );

    return (
      <Button className={className} testID={testID} onClick={onClick}>
        <T id="reDelegate" />
      </Button>
    );
  }
);

const COMMON_BUTTON_CLASSNAMES = clsx(
  'flex items-center justify-center p-2 leading-none rounded-md',
  'transition ease-in-out duration-300'
);

const getBakingButtonClassName = (disabled?: boolean, loading = false) =>
  clsx(
    COMMON_BUTTON_CLASSNAMES,
    'font-semibold text-white',
    disabled ? 'bg-gray-400' : clsx('bg-blue-500', !loading && 'hover:bg-blue-600 focus:bg-blue-600'),
    (disabled || loading) && 'pointer-events-none'
  );

interface CannotDelegateButtonProps extends TestIDProps, PropsWithChildren {
  className: string;
}

const CannotDelegateButton: FC<CannotDelegateButtonProps> = props => {
  const ref = useTippy<HTMLButtonElement>({
    trigger: 'mouseenter',
    hideOnClick: false,
    content: t('disabledForWatchOnlyAccount'),
    animation: 'shift-away-subtle'
  });

  return <Button ref={ref} {...props} />;
};
