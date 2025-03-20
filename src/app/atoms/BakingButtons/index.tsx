import React, { ButtonHTMLAttributes, FC, memo, PropsWithChildren, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import { Spinner } from 'app/atoms';
import { Button } from 'app/atoms/Button';
import { TestIDProperty, TestIDProps } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { useConfirm } from 'lib/ui/dialog';
import useTippy from 'lib/ui/useTippy';
import { Link } from 'lib/woozie';

import { StyledButton } from '../StyledButton';

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

  if (disabled) return <CannotDelegateButton>{children}</CannotDelegateButton>;

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
  disabled: boolean;
  staked: boolean;
  onConfirm?: EmptyFn;
}

export const RedelegateButton = memo<RedelegateButtonProps>(({ disabled, staked, onConfirm, testID }) => {
  const customConfirm = useConfirm();

  const handleClick = useCallback(() => {
    if (staked) {
      customConfirm({
        title: t('importantNotice'),
        description: t('redelegationNoticeDescription'),
        confirmButtonText: t('okGotIt'),
        showCancelButton: false
      }).then(confirmed => {
        if (confirmed) onConfirm?.();
      });
    } else {
      onConfirm?.();
    }
  }, [customConfirm, onConfirm, staked]);

  return (
    <StyledButton disabled={disabled} color="secondary-low" size="S" testID={testID} onClick={handleClick}>
      <T id="reDelegate" />
    </StyledButton>
  );
});

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

interface CannotDelegateButtonProps extends TestIDProps, PropsWithChildren {}

const CannotDelegateButton: FC<CannotDelegateButtonProps> = props => {
  const ref = useTippy<HTMLButtonElement>({
    trigger: 'mouseenter',
    hideOnClick: false,
    content: t('disabledForWatchOnlyAccount'),
    animation: 'shift-away-subtle'
  });

  return <Button ref={ref} {...props} />;
};
