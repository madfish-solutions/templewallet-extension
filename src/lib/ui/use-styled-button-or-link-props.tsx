import React, { useMemo } from 'react';

import clsx from 'clsx';

import { Loader } from 'app/atoms';
import { ButtonProps } from 'app/atoms/Button';
import { LinkProps } from 'lib/woozie/Link';

type Size = 'L' | 'M' | 'S';

export type StyledButtonColor = 'primary' | 'primary-low' | 'secondary' | 'secondary-low' | 'red' | 'red-low';

export interface ButtonLikeStylingProps {
  size: Size;
  color: StyledButtonColor;
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

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
      return 'bg-error hover:bg-error-hover text-white';
    case 'red-low':
      return 'bg-error-low hover:bg-error-hover-low text-error hover:text-error-hover';
  }
}

const SIZE_CLASSNAME: Record<Size, string> = {
  L: 'py-2 px-3 rounded-lg text-font-regular-bold',
  M: 'py-1 px-2 rounded-lg text-font-medium-bold',
  S: 'py-1 px-2 rounded-lg text-font-description-bold'
};

export function useStyledButtonClassName(
  { size, color, active, disabled }: ButtonLikeStylingProps,
  className?: string
) {
  return useMemo(
    () => clsx(SIZE_CLASSNAME[size], getStyledButtonColorsClassNames(color, active, disabled), className),
    [active, className, color, disabled, size]
  );
}

export function useStyledButtonOrLinkProps(inputProps: ButtonProps & ButtonLikeStylingProps): ButtonProps;
export function useStyledButtonOrLinkProps(inputProps: LinkProps & ButtonLikeStylingProps): LinkProps;
export function useStyledButtonOrLinkProps({
  size,
  color,
  active,
  loading,
  className: classNameProp,
  children: childrenProp,
  ...restProps
}: (ButtonProps | LinkProps) & ButtonLikeStylingProps): ButtonProps | LinkProps {
  const isLink = 'to' in restProps;
  const disabled = 'disabled' in restProps && restProps.disabled;

  const className = useStyledButtonClassName({ size, color, active, disabled }, classNameProp);

  const children = loading ? (
    <div className="w-full flex justify-center">
      <Loader size={size} trackVariant={className.includes('text-white') ? 'light' : 'dark'} />
    </div>
  ) : (
    childrenProp
  );

  return isLink
    ? { ...restProps, children, className }
    : { ...restProps, children, className, disabled: disabled || loading };
}
