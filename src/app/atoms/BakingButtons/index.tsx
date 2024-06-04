import React, { ButtonHTMLAttributes, FC, memo, PropsWithChildren, useCallback, useMemo } from 'react';

import clsx from 'clsx';

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
        small ? 'text-sm' : 'text-sm',
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
  onClick?: EmptyFn;
}

export const StakeButton = memo<StakeButtonProps>(({ type, disabled, testID, onClick }) => {
  const className = useMemo(() => clsx(getBakingButtonClassName(disabled), 'min-h-12 text-base'), [disabled]);

  return (
    <Button type={type} className={className} disabled={disabled} onClick={onClick} testID={testID}>
      <T id="stake" />
    </Button>
  );
});

interface RedelegateButtonProps extends TestIDProperty {
  disabled: boolean;
  staked: boolean;
}

export const RedelegateButton = memo<RedelegateButtonProps>(({ disabled, staked, testID }) => {
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

  if (staked) return <RedelegateButtonWithConfirmation className={className} testID={testID} />;

  return (
    <Link to="/delegate" className={className} testID={testID}>
      <T id="reDelegate" />
    </Link>
  );
});

const RedelegateButtonWithConfirmation = memo<PropsWithClassName<TestIDProperty>>(({ className, testID }) => {
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
        if (confirmed) navigate('/delegate');
      }),
    [customConfirm]
  );

  return (
    <Button className={className} testID={testID} onClick={onClick}>
      <T id="reDelegate" />
    </Button>
  );
});

const COMMON_BUTTON_CLASSNAMES = clsx(
  'flex items-center justify-center p-2 leading-none rounded-md',
  'transition ease-in-out duration-300'
);

const getBakingButtonClassName = (disabled?: boolean) =>
  clsx(
    COMMON_BUTTON_CLASSNAMES,
    'font-semibold text-white',
    disabled ? 'bg-gray-400 pointer-events-none' : 'bg-blue-500 hover:bg-blue-600 focus:bg-blue-600'
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
