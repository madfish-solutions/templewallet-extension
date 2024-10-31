import React from 'react';

import { ButtonLikeStylingProps, useStyledButtonOrLinkProps } from 'lib/ui/use-styled-button-or-link-props';

import { Button, ButtonProps } from './Button';

export interface StyledButtonProps extends Omit<ButtonProps, 'color'>, ButtonLikeStylingProps {}

export const StyledButton = React.forwardRef<HTMLButtonElement, StyledButtonProps>((inputProps, ref) => {
  const buttonProps = useStyledButtonOrLinkProps(inputProps);

  return <Button ref={ref} {...buttonProps} />;
});
