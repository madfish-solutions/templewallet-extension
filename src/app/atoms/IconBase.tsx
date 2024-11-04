import React, { forwardRef, memo } from 'react';

import clsx from 'clsx';

export type Size = 12 | 16 | 24 | 32;

export interface IconBaseProps {
  /** SVG of the 16px icon base container */
  Icon: ImportedSVGComponent;
  size?: Size;
  className?: string;
  onClick?: EmptyFn;
}

/** For monochrome icons */
export const IconBase = memo(
  forwardRef<HTMLDivElement, IconBaseProps>(({ size = 16, className, Icon, onClick }, ref) => (
    <div ref={ref} data-icon-size={size} className={clsx(CONTAINER_CLASSNAME[size], className)} onClick={onClick}>
      <Icon className="w-full h-full stroke-current fill-current" transform={SCALE_TRANSFORMS[size]} />
    </div>
  ))
);

/** Exact icons (icons' base containers) sizes */
const CONTAINER_CLASSNAME: Record<Size, string> = {
  12: 'h-4 w-4',
  16: 'h-6 w-6',
  24: 'h-6 w-6',
  32: 'h-8 w-8'
};

const COMMON_SCALE_FACTOR = 24 / 16;
const buildScaleTransform = (scale: number) => `scale(${scale})`;

/** Scale formula = (16_base / target_base) * (target_icon / 16_icon) */
const SCALE_TRANSFORMS: Record<Size, string | undefined> = {
  12: buildScaleTransform(COMMON_SCALE_FACTOR * (12 / 16)),
  16: undefined, // Icon of size 16 comes with same sized container already
  24: buildScaleTransform(COMMON_SCALE_FACTOR * (20 / 24)),
  32: buildScaleTransform(COMMON_SCALE_FACTOR * (24 / 32))
};
