import React, { FC, useMemo } from 'react';

import clsx from 'clsx';

import { Button, ButtonProps } from 'app/atoms/Button';
import { ReactComponent as ManageIcon } from 'app/icons/manage.svg';
import useTippy from 'lib/ui/useTippy';
import { combineRefs } from 'lib/ui/util';

interface ButtonForManageDropdownProps extends ButtonProps {
  opened: boolean;
  tooltip?: string;
}

export const ButtonForManageDropdown: FC<ButtonForManageDropdownProps> = React.forwardRef<
  HTMLButtonElement,
  ButtonForManageDropdownProps
>(({ opened, tooltip, ...buttonProps }, popperRef) => {
  const withTippy = !opened && tooltip;

  const tippyProps = useMemo(
    () => ({
      trigger: withTippy ? 'mouseenter' : '__SOME_INVALID_VALUE__',
      hideOnClick: true,
      content: tooltip,
      animation: 'shift-away-subtle'
    }),
    [withTippy, tooltip]
  );

  const tippyRef = useTippy<HTMLButtonElement>(tippyProps);

  const ref = useMemo(() => combineRefs<HTMLButtonElement>(popperRef, tippyRef), [popperRef, tippyRef]);

  return (
    <Button
      {...buttonProps}
      ref={ref}
      className={clsx(
        'flex flex-shrink-0 items-center justify-center w-10 rounded-lg',
        'transition ease-in-out duration-200 hover:bg-gray-200',
        'opacity-75 hover:opacity-100 focus:opacity-100',
        opened && 'bg-gray-200'
      )}
    >
      <ManageIcon className="w-4 h-4 stroke-current fill-current text-gray-600" />
    </Button>
  );
});
