import React, { memo } from 'react';

import clsx from 'clsx';

type Size = 12 | 16 | 24 | 32;

export interface IconBaseProps {
  /** SVG of the 16px icon base container */
  Icon: ImportedSVGComponent;
  size: Size;
  className?: string;
}

/** For monochrome icons */
export const IconBase = memo<IconBaseProps>(({ size, className, Icon }) => (
  <div data-icon-size={size} className={clsx(CONTAINER_CLASSNAME[size], className)}>
    <Icon
      className="w-full h-full stroke-current fill-current"
      /** Icon of size 16 comes with same sized container already */
      transform={size === 16 ? undefined : `scale(${SCALES[size]})`}
    />
  </div>
));

type ScaledSize = Exclude<Size, 16>;

/** Exact icons (icons' base containers) sizes */
const CONTAINER_CLASSNAME: Record<Size, string> = {
  12: 'h-4 w-4',
  16: 'h-6 w-6',
  24: 'h-6 w-6',
  32: 'h-8 w-8'
};

const COMMON_SCALE_FACTOR = 24 / 16;

/** Scale = (16_base / target_base) * (target_icon / 16_icon) */
const SCALES: Record<ScaledSize, number> = {
  12: COMMON_SCALE_FACTOR * (12 / 16),
  // 16: 1,
  24: COMMON_SCALE_FACTOR * (20 / 24),
  32: COMMON_SCALE_FACTOR * (24 / 32)
};
