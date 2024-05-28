import React, { FC, memo, PropsWithChildren, useMemo } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms/Button';
import { useUserTestingGroupNameSelector } from 'app/store/ab-testing/selectors';
import { TestIDProperty, TestIDProps } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import useTippy from 'lib/ui/useTippy';
import { Link } from 'lib/woozie';

import ModStyles from './styles.module.css';

interface Props extends TestIDProperty {
  to: string;
  disabled: boolean;
  thinner?: boolean;
  flashing?: boolean;
}

export const DelegateButton: FC<PropsWithChildren<Props>> = ({ to, disabled, thinner, flashing, testID, children }) => {
  const className = useMemo(
    () =>
      clsx(
        COMMON_BUTTON_CLASSNAMES,
        'text-xs font-semibold bg-blue-500 text-white',
        thinner ? 'min-h-10' : 'min-h-11',
        !disabled && 'hover:bg-blue-600 focus:bg-blue-600',
        disabled ? 'opacity-50 cursor-default' : flashing && ModStyles.delegateButton
      ),
    [disabled, thinner, flashing]
  );

  const testIDProperties = useTestIdParams();

  if (disabled) return <CannotDelegateButton className={className}>{children}</CannotDelegateButton>;

  return (
    <Link to={to} type="button" className={className} testID={testID} testIDProperties={testIDProperties}>
      {children}
    </Link>
  );
};

interface StakeButtonProps extends TestIDProperty {
  disabled: boolean;
  onClick?: EmptyFn;
}

export const StakeButton: FC<StakeButtonProps> = ({ disabled, testID, onClick }) => {
  const className = useMemo(
    () =>
      clsx(
        COMMON_BUTTON_CLASSNAMES,
        'min-h-12 text-base font-semibold bg-blue-500 text-white',
        disabled ? 'opacity-50 cursor-default' : 'hover:bg-blue-600 focus:bg-blue-600'
      ),
    [disabled]
  );

  const testIDProperties = useTestIdParams();

  const children = <T id="stake" />;

  return (
    <Button
      className={className}
      disabled={disabled}
      onClick={onClick}
      testID={testID}
      testIDProperties={testIDProperties}
    >
      {children}
    </Button>
  );
};

interface RequestUnstakeButtonProps extends TestIDProperty, PropsWithChildren {
  disabled: boolean;
  onClick?: EmptyFn;
}

export const UnstakeButton: FC<RequestUnstakeButtonProps> = ({ disabled, testID, onClick, children }) => {
  const className = useMemo(
    () =>
      clsx(
        COMMON_BUTTON_CLASSNAMES,
        'min-h-10 text-xs font-semibold bg-orange-500 text-white',
        disabled && 'opacity-50 cursor-default'
      ),
    [disabled]
  );

  const testIDProperties = useTestIdParams();

  return (
    <Button
      className={className}
      disabled={disabled}
      onClick={onClick}
      testID={testID}
      testIDProperties={testIDProperties}
    >
      {children}
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
        'whitespace-nowrap text-xs font-medium bg-gray-200',
        disabled && 'opacity-50 cursor-default'
      ),
    [disabled]
  );

  const testIDProperties = useTestIdParams();

  const children = <T id="reDelegate" />;

  if (disabled) return <CannotDelegateButton className={className}>{children}</CannotDelegateButton>;

  return (
    <Link to="/delegate" type="button" className={className} testID={testID} testIDProperties={testIDProperties}>
      {children}
    </Link>
  );
});

const COMMON_BUTTON_CLASSNAMES = clsx(
  'flex items-center justify-center p-2 leading-none rounded-md',
  'transition ease-in-out duration-300'
);

interface DelegateButtonProps extends TestIDProps, PropsWithChildren {
  className: string;
}

const CannotDelegateButton: FC<DelegateButtonProps> = props => {
  const ref = useTippy<HTMLButtonElement>({
    trigger: 'mouseenter',
    hideOnClick: false,
    content: t('disabledForWatchOnlyAccount'),
    animation: 'shift-away-subtle'
  });

  return <Button ref={ref} {...props} />;
};

const useTestIdParams = () => {
  const testGroupName = useUserTestingGroupNameSelector();

  return useMemo(() => ({ abTestingCategory: testGroupName }), [testGroupName]);
};
