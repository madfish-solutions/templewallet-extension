import React, { FC, memo, useMemo } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms/Button';
import { useUserTestingGroupNameSelector } from 'app/store/ab-testing/selectors';
import { TestIDProps } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import useTippy from 'lib/ui/useTippy';
import { Link } from 'lib/woozie';

import { BakingSectionSelectors } from './selectors';
import ModStyles from './styles.module.css';

interface Props {
  canDelegate: boolean;
}

export const DelegateButton = memo<Props>(({ canDelegate }) => {
  const testGroupName = useUserTestingGroupNameSelector();

  const className = useMemo(
    () =>
      clsx(
        'text-center py-3 px-4',
        'text-base leading-5 font-semibold',
        'rounded-md bg-blue-500 text-white',
        'transition ease-in-out duration-300',
        canDelegate && 'hover:bg-blue-600 focus:bg-blue-600',
        canDelegate && 'hover:border-blue-600 focus:border-blue-600',
        canDelegate ? ModStyles.delegateButton : 'opacity-50'
      ),
    [canDelegate]
  );

  const testIDProperties = useMemo(() => ({ abTestingCategory: testGroupName }), [testGroupName]);

  const Component = canDelegate ? CanDelegateButton : CannotDelegateButton;

  return (
    <Component
      className={className}
      testID={BakingSectionSelectors.delegateNowButton}
      testIDProperties={testIDProperties}
    >
      Delegate & Stake
    </Component>
  );
});

export const RedelegateButton = memo<Props>(({ canDelegate }) => {
  const testGroupName = useUserTestingGroupNameSelector();

  const className = useMemo(
    () =>
      clsx(
        'h-5 px-2 rounded flex items-center',
        'border border-indigo-500 text-indigo-500',
        'transition ease-in-out duration-300',
        canDelegate && 'hover:border-indigo-600 focus:border-indigo-600',
        canDelegate && 'hover:text-indigo-600 focus:text-indigo-600',
        !canDelegate && 'opacity-50'
      ),
    [canDelegate]
  );

  const testIDProperties = useMemo(() => ({ abTestingCategory: testGroupName }), [testGroupName]);

  const Component = canDelegate ? CanDelegateButton : CannotDelegateButton;

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
  testID: BakingSectionSelectors;
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
