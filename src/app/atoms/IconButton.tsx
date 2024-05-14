import React, { forwardRef, memo, useMemo } from 'react';

import clsx from 'clsx';

import { TestIDProps } from 'lib/analytics';
import useTippy from 'lib/ui/useTippy';
import { combineRefs } from 'lib/ui/utils';

import { Button } from './Button';
import { IconBase } from './IconBase';
import {
  StyledButtonColor,
  ACTIVE_STYLED_BUTTON_COLORS_CLASSNAME,
  getStyledButtonColorsClassNames
} from './StyledButton';

type Color = 'blue' | 'orange' | 'red';

interface Props extends TestIDProps {
  Icon: ImportedSVGComponent;
  color?: Color;
  active?: boolean;
  tooltip?: string;
  onClick?: EmptyFn;
}

export const IconButton = memo(
  forwardRef<HTMLButtonElement, Props>(({ Icon, color, active, tooltip, onClick, testID, testIDProperties }, ref) => {
    const disabled = !onClick;

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
      <Button
        ref={finalRef}
        className={clsx('p-1 rounded-md', colorClassName)}
        disabled={disabled || active}
        onClick={onClick}
        testID={testID}
        testIDProperties={testIDProperties}
      >
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
