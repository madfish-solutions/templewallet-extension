import { FC, Ref } from 'react';

import clsx from 'clsx';

import {
  ButtonLikeStylingProps,
  useStyledButtonClassName,
  useStyledButtonOrLinkProps
} from 'lib/ui/use-styled-button-or-link-props';

import { Anchor, AnchorProps } from './Anchor';
import { Button, ButtonProps } from './Button';

export interface StyledButtonProps extends Omit<ButtonProps, 'color'>, ButtonLikeStylingProps {}

interface StyledButtonComponentProps extends StyledButtonProps {
  ref?: Ref<HTMLButtonElement>;
}

export const StyledButton: FC<StyledButtonComponentProps> = (inputProps: StyledButtonComponentProps) => {
  const { ref, ...rest } = inputProps;
  const buttonProps = useStyledButtonOrLinkProps(rest);

  return <Button ref={ref} {...buttonProps} />;
};

type StyledButtonAnchorProps = AnchorProps &
  ButtonLikeStylingProps & {
    ref?: Ref<HTMLAnchorElement>;
  };

export const StyledButtonAnchor: FC<StyledButtonAnchorProps> = ({
  size,
  color,
  active,
  disabled,
  className: classNameProp,
  ref,
  ...props
}) => {
  const className = useStyledButtonClassName({ size, color, active, disabled }, clsx('text-center', classNameProp));

  return <Anchor ref={ref} {...props} className={className} treatAsButton />;
};
