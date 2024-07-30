import React, { useMemo } from 'react';

import clsx from 'clsx';

import { Button, ButtonProps } from './Button';

type Size = 'L' | 'M' | 'S';

export type StyledButtonColor = 'primary' | 'primary-low' | 'secondary' | 'secondary-low' | 'red' | 'red-low';

interface Props extends ButtonProps {
  size: Size;
  color: StyledButtonColor;
  active?: boolean;
}

export const StyledButton = React.forwardRef<HTMLButtonElement, Props>(
  ({ size, color, active, disabled, className, ...otherProps }, ref) => {
    const colorClassName = useMemo(
      () => getStyledButtonColorsClassNames(color, active, disabled),
      [active, disabled, color]
    );

    return (
      <Button
        ref={ref}
        className={clsx(SIZE_CLASSNAME[size], colorClassName, className)}
        disabled={disabled}
        {...otherProps}
      />
    );
  }
);

export const ACTIVE_STYLED_BUTTON_COLORS_CLASSNAME = 'bg-grey-4 text-grey-1';

export function getStyledButtonColorsClassNames(color: StyledButtonColor, active = false, disabled = false) {
  if (active) return ACTIVE_STYLED_BUTTON_COLORS_CLASSNAME;
  if (disabled) return 'bg-disable text-grey-3';

  switch (color) {
    case 'primary':
      return 'bg-primary hover:bg-primary-hover text-white';
    case 'primary-low':
      return 'bg-primary-low hover:bg-primary-hover-low text-primary hover:text-primary-hover';
    case 'secondary':
      return 'bg-secondary hover:bg-secondary-hover text-white';
    case 'secondary-low':
      return 'bg-secondary-low hover:bg-secondary-hover-low text-secondary hover:text-secondary-hover';
    case 'red':
      return 'bg-red hover:bg-red-hover text-white';
    case 'red-low':
      return 'bg-error-low hover:bg-error-hover-low text-error hover:text-error-hover';
  }
}

const SIZE_CLASSNAME: Record<Size, string> = {
  L: 'py-2 px-3 rounded-lg text-font-regular-bold',
  M: 'py-1 px-2 rounded-lg text-font-medium-bold',
  S: 'py-1 px-2 rounded-lg text-font-description-bold'
};
