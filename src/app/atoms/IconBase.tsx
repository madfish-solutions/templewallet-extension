import React, { memo } from 'react';

import clsx from 'clsx';

type Size = 12 | 16 | 24 | 32;

export interface IconBaseProps {
  /** SVG of the inner element of 16px icon type (in Figma) */
  Icon: ImportedSVGComponent;
  size: Size;
  className?: string;
}

const SIZE_CLASSNAME: Record<Size, string> = {
  12: 'h-4 w-4 p-0.5',
  16: 'h-6 w-6 p-1',
  24: 'h-6 w-6 p-0.5',
  32: 'h-8 w-8 p-0.5'
};

export const IconBase = memo<IconBaseProps>(({ size, className, Icon }) => (
  <Icon className={clsx('stroke-current fill-current', SIZE_CLASSNAME[size], className)} />
));
