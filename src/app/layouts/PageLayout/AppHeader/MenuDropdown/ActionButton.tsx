import React, { memo } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms/Button';
import { TID, T } from 'lib/i18n';
import { Link } from 'lib/woozie';

export interface ActionButtonProps {
  Icon: ImportedSVGComponent;
  i18nKey: TID;
  linkTo: string | null;
  onClick: EmptyFn;
  testID: string;
}

export const ActionButton = memo<ActionButtonProps>(({ Icon, linkTo, onClick, i18nKey, testID }) => {
  const baseProps = {
    testID,
    className: clsx('flex items-center py-1.5 px-2 gap-x-1 rounded-md', 'hover:bg-secondary-low'),
    onClick,
    children: (
      <>
        <div className="flex items-center w-6 h-6 text-secondary">
          <Icon className="w-4 h-4 m-auto stroke-current fill-current" />
        </div>

        <span className="text-xs">
          <T id={i18nKey} />
        </span>
      </>
    )
  };

  return linkTo ? <Link {...baseProps} to={linkTo} /> : <Button {...baseProps} />;
});
