import React, { memo } from 'react';

import clsx from 'clsx';

import { T } from 'lib/i18n';

type LinesType = 'line' | 'divider' | 'or';
type Orientation = 'horizontal' | 'vertical';

interface LinesProps {
  type?: LinesType;
  className?: string;
  style?: React.CSSProperties;
  orientation?: Orientation;
}

export const Lines = memo<LinesProps>(({ type = 'divider', className, orientation = 'horizontal', style }) => {
  const isHorizontal = orientation === 'horizontal';
  const isLine = type === 'line';

  return (
    <div
      className={clsx('flex items-center gap-2', isHorizontal ? 'w-auto' : 'h-auto flex-col', className)}
      style={style}
    >
      <div
        className={clsx('flex-1 border-lines', {
          'border-b-0.5': isLine && isHorizontal,
          'border-b': !isLine && isHorizontal,
          'border-r-0.5': isLine && !isHorizontal,
          'border-r': !isLine && !isHorizontal
        })}
      />
      {type === 'or' && (
        <>
          <span className="text-font-small text-grey-3 font-semibold">
            <T id="or" />
          </span>
          <div className="flex-1 border-b border-lines" />
        </>
      )}
    </div>
  );
});
