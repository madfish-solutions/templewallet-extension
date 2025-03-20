import React, { FC } from 'react';

import clsx from 'clsx';

import {
  ButtonLikeStylingProps,
  useStyledButtonClassName,
  useStyledButtonOrLinkProps
} from 'lib/ui/use-styled-button-or-link-props';
import { Link, LinkProps } from 'lib/woozie/Link';

import { Anchor, AnchorProps } from './Anchor';
import { Button, ButtonProps } from './Button';

export interface StyledButtonProps extends Omit<ButtonProps, 'color'>, ButtonLikeStylingProps {}

export const StyledButton = React.forwardRef<HTMLButtonElement, StyledButtonProps>((inputProps, ref) => {
  const buttonProps = useStyledButtonOrLinkProps(inputProps);

  return <Button ref={ref} {...buttonProps} />;
});

export const StyledButtonAnchor = React.forwardRef<HTMLAnchorElement, AnchorProps & ButtonLikeStylingProps>(
  ({ size, color, active, disabled, className: classNameProp, ...props }, ref) => {
    const className = useStyledButtonClassName({ size, color, active, disabled }, clsx('text-center', classNameProp));

    return <Anchor ref={ref} {...props} className={className} treatAsButton />;
  }
);

export const StyledButtonLink: FC<LinkProps & ButtonLikeStylingProps> = ({
  size,
  color,
  active,
  disabled,
  className: classNameProp,
  ...props
}) => {
  const className = useStyledButtonClassName({ size, color, active, disabled }, clsx('text-center', classNameProp));

  return <Link {...props} className={className} />;
};
