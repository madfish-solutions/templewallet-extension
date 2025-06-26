import React, { forwardRef, memo, useMemo } from 'react';

import clsx from 'clsx';

import {
  StyledButtonColor,
  ACTIVE_STYLED_BUTTON_COLORS_CLASSNAME,
  getStyledButtonColorsClassNames
} from 'lib/ui/use-styled-button-or-link-props';
import useTippy from 'lib/ui/useTippy';
import { combineRefs } from 'lib/ui/utils';

import { Button, ButtonProps } from './Button';
import { IconBase } from './IconBase';

type Color = 'blue' | 'orange' | 'red';

interface IconButtonProps extends ButtonProps {
  Icon: ImportedSVGComponent;
  color?: Color;
  active?: boolean;
  tooltip?: string;
}

export const IconButton = memo(
  forwardRef<HTMLButtonElement, IconButtonProps>(({ Icon, color, active, tooltip, ...rest }, ref) => {
    const tippyProps = useMemo(
      () => ({
        trigger: tooltip ? 'mouseenter' : '__SOME_INVALID_VALUE__',
        hideOnClick: true,
        content: tooltip,
        animation: 'shift-away-subtle'
      }),
      [tooltip]
    );

    const tippyRef = useTippy<HTMLButtonElement>(tippyProps);

    const finalRef = useMemo(() => combineRefs<HTMLButtonElement>(ref, tippyRef), [ref, tippyRef]);

    const colorClassName = useMemo(() => {
      if (active) return clsx(ACTIVE_STYLED_BUTTON_COLORS_CLASSNAME, 'shadow-none');

      return color
        ? getStyledButtonColorsClassNames(MAP_TO_STYLED_BUTTON_COLORS[color])
        : 'bg-white text-primary shadow-bottom hover:bg-grey-4 hover:shadow-none hover:text-primary-hover';
    }, [active, color]);

    return (
      <Button ref={finalRef} className={clsx('p-1 rounded-md', colorClassName)} {...rest}>
        <IconBase size={16} Icon={Icon} />
      </Button>
    );
  })
);

const MAP_TO_STYLED_BUTTON_COLORS: Record<Color, StyledButtonColor> = {
  blue: 'secondary-low',
  orange: 'primary-low',
  red: 'red-low'
};
