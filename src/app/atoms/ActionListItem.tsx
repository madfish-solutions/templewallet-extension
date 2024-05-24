import React, { memo } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { Button } from 'app/atoms/Button';
import { Link } from 'lib/woozie';

export interface ActionListItemProps extends PropsWithChildren {
  Icon?: ImportedSVGComponent;
  linkTo?: string;
  className?: string;
  onClick?: EmptyFn;
  /** Pass it, if you want it to be called with `false` on click too */
  setOpened?: SyncFn<boolean>;
  testID?: string;
  danger?: boolean;
}

export const ActionListItem = memo<ActionListItemProps>(
  ({ Icon, linkTo, className, onClick, setOpened, testID, danger, children }) => {
    const baseProps = {
      testID,
      className: clsx(
        'flex items-center py-1.5 px-2 gap-x-1 rounded-md text-font-description',
        'hover:bg-secondary-low',
        className
      ),
      onClick: setOpened
        ? () => {
            setOpened(false);
            onClick?.();
          }
        : onClick,
      children: (
        <>
          {Icon && <IconBase Icon={Icon} size={16} className={danger ? 'text-error' : 'text-secondary'} />}

          {children}
        </>
      )
    };

    return linkTo ? <Link {...baseProps} to={linkTo} /> : <Button {...baseProps} />;
  }
);
