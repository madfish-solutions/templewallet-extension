import React, { memo } from 'react';

import clsx from 'clsx';

type Size = 12 | 16 | 24 | 32;
type ScaledSize = Exclude<Size, 16>;

export interface IconBaseProps {
  /** SVG of the 16px icon base container */
  Icon: ImportedSVGComponent;
  size: Size;
  className?: string;
}

/** Exact icons (icons' base containers) sizes */
const CONTAINER_CLASSNAME: Record<ScaledSize, string> = {
  12: 'h-4 w-4',
  // 16: 'h-6 w-6',
  // 16: 'contents',
  24: 'h-6 w-6',
  32: 'h-8 w-8'
};

const SVG_CLASSNAME: Record<ScaledSize, string> = {
  // 12: 'h-4 w-4 p-0.5',
  // 16: 'h-6 w-6 p-1',
  // 24: 'h-6 w-6 p-0.5',
  // 32: 'h-8 w-8 p-0.5',
  12: 'h-[1.125rem] w-[1.125rem]',
  // 16: 'h-6 w-6',
  24: 'h-[1.875rem] w-[1.875rem]',
  32: 'h-[2.25rem] w-[2.25rem]'
};

/** For monochrome icons */
export const IconBase = memo<IconBaseProps>(({ size, className, Icon }) => {
  /** Icon of size 16 comes with (same size) container already */
  if (size === 16) return <Icon className={clsx('stroke-current fill-current h-6 w-6', className)} />;

  return (
    <div className={className}>
      <div className={clsx('relative overflow-hidden', CONTAINER_CLASSNAME[size])}>
        <Icon
          className={clsx(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'stroke-current fill-current',
            SVG_CLASSNAME[size]
          )}
        />
      </div>
    </div>
  );
});
