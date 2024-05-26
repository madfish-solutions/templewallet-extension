import React, { FC, memo, PropsWithChildren, useMemo } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms/Button';
import { useUserTestingGroupNameSelector } from 'app/store/ab-testing/selectors';
import { TestIDProperty, TestIDProps } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import useTippy from 'lib/ui/useTippy';
import { Link } from 'lib/woozie';

import { BakingSectionSelectors } from './selectors';
import ModStyles from './styles.module.css';

interface Props extends TestIDProperty {
  disabled: boolean;
  thinner?: boolean;
}

export const DelegateButton: FC<PropsWithChildren<Props>> = ({ disabled, thinner, testID, children }) => {
  const testGroupName = useUserTestingGroupNameSelector();

  const className = useMemo(
    () =>
      clsx(
        'flex items-center justify-center p-2',
        'text-xs leading-none font-semibold',
        'rounded-md bg-blue-500 text-white',
        'transition ease-in-out duration-300',
        thinner ? 'min-h-10' : 'min-h-11',
        !disabled && 'hover:bg-blue-600 focus:bg-blue-600',
        !disabled && 'hover:border-blue-600 focus:border-blue-600',
        disabled ? 'opacity-50' : ModStyles.delegateButton
      ),
    [disabled, thinner]
  );

  const testIDProperties = useMemo(() => ({ abTestingCategory: testGroupName }), [testGroupName]);

  const Component = disabled ? CannotDelegateButton : CanDelegateButton;

  return (
    <Component className={className} testID={testID} testIDProperties={testIDProperties}>
      {children}
    </Component>
  );
};

export const RedelegateButton = memo<Props>(({ disabled }) => {
  const testGroupName = useUserTestingGroupNameSelector();

  const className = useMemo(
    () =>
      clsx(
        'p-2 whitespace-nowrap rounded-md bg-gray-200',
        'text-xs leading-none font-medium',
        'transition ease-in-out duration-300',
        !disabled && 'hover:border-indigo-600 focus:border-indigo-600',
        !disabled && 'hover:text-indigo-600 focus:text-indigo-600',
        disabled && 'opacity-50'
      ),
    [disabled]
  );

  const testIDProperties = useMemo(() => ({ abTestingCategory: testGroupName }), [testGroupName]);

  const Component = disabled ? CannotDelegateButton : CanDelegateButton;

  return (
    <Component
      className={className}
      testID={BakingSectionSelectors.reDelegateButton}
      testIDProperties={testIDProperties}
    >
      <T id="reDelegate" />
    </Component>
  );
});

interface DelegateButtonProps extends TestIDProps, PropsWithChildren {
  className: string;
}

const CanDelegateButton: FC<DelegateButtonProps> = props => <Link to="/delegate" type="button" {...props} />;

const CannotDelegateButton: FC<DelegateButtonProps> = props => {
  const delegateButtonRef = useTippy<HTMLButtonElement>({
    trigger: 'mouseenter',
    hideOnClick: false,
    content: t('disabledForWatchOnlyAccount'),
    animation: 'shift-away-subtle'
  });

  return <Button ref={delegateButtonRef} {...props} />;
};
