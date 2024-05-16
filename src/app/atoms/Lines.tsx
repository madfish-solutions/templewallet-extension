import React, { memo } from 'react';

import clsx from 'clsx';

import { T } from 'lib/i18n';

type LinesType = 'line' | 'divider' | 'or';

interface LinesProps {
  type?: LinesType;
  className?: string;
  style?: React.CSSProperties;
}

export const Lines = memo<LinesProps>(({ type = 'divider', className, style }) => (
  <div className={clsx('w-auto flex items-center gap-2', className)} style={style}>
    <div className={clsx('flex-1 border-lines', type === 'line' ? 'border-b-0.5' : 'border-b')} />
    {type === 'or' && (
      <>
        <span className="text-xxxs text-grey-3 font-semibold">
          <T id="or" />
        </span>
        <div className="flex-1 border-b border-lines" />
      </>
    )}
  </div>
));
