import React, { ButtonHTMLAttributes, FC, memo, PropsWithChildren, useMemo } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms/Button';
import { TestIDProperty, TestIDProps } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import useTippy from 'lib/ui/useTippy';
import { Link } from 'lib/woozie';

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
        COMMON_BUTTON_CLASSNAMES,
        'font-semibold bg-blue-500 text-white',
        small ? 'text-sm' : 'text-sm',
        slim ? 'min-h-10' : 'min-h-11',
        !disabled && 'hover:bg-blue-600 focus:bg-blue-600',
        disabled ? 'opacity-50 cursor-default' : flashing && ModStyles.delegateButton
      ),
    [disabled, small, slim, flashing]
  );

  if (disabled) return <CannotDelegateButton className={className}>{children}</CannotDelegateButton>;

  return (
    <Link to={to} type="button" className={className} testID={testID}>
      {children}
    </Link>
  );
};

interface StakeButtonProps extends TestIDProperty {
  type?: ButtonHTMLAttributes<unknown>['type'];
  disabled: boolean;
  onClick?: EmptyFn;
}

export const StakeButton: FC<StakeButtonProps> = ({ type, disabled, testID, onClick }) => {
  const className = useMemo(
    () =>
      clsx(
        COMMON_BUTTON_CLASSNAMES,
        'min-h-12 text-base font-semibold bg-blue-500 text-white',
        disabled ? 'opacity-50 cursor-default' : 'hover:bg-blue-600 focus:bg-blue-600'
      ),
    [disabled]
  );

  return (
    <Button type={type} className={className} disabled={disabled} onClick={onClick} testID={testID}>
      <T id="stake" />
    </Button>
  );
};

interface RedelegateButtonProps extends TestIDProperty {
  disabled: boolean;
}

export const RedelegateButton = memo<RedelegateButtonProps>(({ disabled, testID }) => {
  const className = useMemo(
    () =>
      clsx(
        COMMON_BUTTON_CLASSNAMES,
        'whitespace-nowrap text-xs font-medium bg-gray-200 text-gray-600',
        disabled ? 'opacity-50 cursor-default' : 'hover:bg-gray-300'
      ),
    [disabled]
  );

  const children = <T id="reDelegate" />;

  if (disabled) return <CannotDelegateButton className={className}>{children}</CannotDelegateButton>;

  return (
    <Link to="/delegate" type="button" className={className} testID={testID}>
      {children}
    </Link>
  );
});

const COMMON_BUTTON_CLASSNAMES = clsx(
  'flex items-center justify-center p-2 leading-none rounded-md',
  'transition ease-in-out duration-300'
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
