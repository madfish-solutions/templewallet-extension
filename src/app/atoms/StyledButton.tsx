import React from 'react';

import { ButtonLikeStylingProps, useStyledButtonOrLinkProps } from 'lib/ui/button-like-styles';

import { Button, ButtonProps } from './Button';

export const StyledButton = React.forwardRef<HTMLButtonElement, ButtonProps & ButtonLikeStylingProps>(
  (inputProps, ref) => {
    const buttonProps = useStyledButtonOrLinkProps(inputProps);

    return <Button ref={ref} {...buttonProps} />;
  }
);
