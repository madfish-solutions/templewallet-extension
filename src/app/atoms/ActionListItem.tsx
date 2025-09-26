import React, { FC } from 'react';

import clsx from 'clsx';

import { Anchor, IconBase } from 'app/atoms';
import { Button } from 'app/atoms/Button';
import { TestIDProps } from 'lib/analytics';
import { Link } from 'lib/woozie';

export interface ActionListItemProps extends PropsWithChildren, TestIDProps {
  Icon?: ImportedSVGComponent;
  linkTo?: string;
  externalLink?: string;
  className?: string;
  onClick?: EmptyFn;
  /** Pass it, if you want it to be called with `false` on click too */
  setOpened?: SyncFn<boolean>;
  testID?: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  withDividerAfter?: boolean;
}

export const ActionListItem: FC<ActionListItemProps> = ({
  Icon,
  linkTo,
  externalLink,
  className,
  onClick,
  setOpened,
  testID,
  testIDProperties,
  active,
  danger,
  disabled,
  children
}) => {
  const baseProps = {
    testID,
    testIDProperties,
    className: clsx(
      'flex items-center py-1.5 px-2 gap-x-1 rounded-md text-font-description w-full',
      active
        ? 'bg-grey-4'
        : disabled
        ? 'cursor-not-allowed text-disable'
        : danger
        ? 'hover:bg-error-low'
        : 'hover:bg-secondary-low',
      className
    ),
    onClick: disabled
      ? undefined
      : setOpened
      ? () => {
          setOpened(false);
          onClick?.();
        }
      : onClick,
    children: (
      <>
        {Icon && (
          <IconBase
            Icon={Icon}
            size={16}
            className={disabled ? 'text-disable' : danger ? 'text-error' : 'text-secondary'}
          />
        )}

        {typeof children === 'string' ? <span className="capitalize">{children}</span> : children}
      </>
    )
  };

  if (disabled) {
    return <Button {...baseProps} disabled />;
  }

  return externalLink ? (
    <Anchor {...baseProps} href={externalLink} />
  ) : linkTo ? (
    <Link {...baseProps} to={linkTo} />
  ) : (
    <Button {...baseProps} />
  );
};
