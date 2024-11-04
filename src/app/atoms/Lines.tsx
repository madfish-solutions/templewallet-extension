import React, { memo } from 'react';

import clsx from 'clsx';

import { T } from 'lib/i18n';

type LinesType = 'line' | 'divider' | 'or';

interface LinesProps {
  type?: LinesType;
  className?: string;
  style?: React.CSSProperties;
}

const COMMON_CONTAINER_CLASS_NAME = 'flex items-center gap-2';
const COMMON_LINE_CLASS_NAME = 'flex-1 border-lines';

export const Lines = memo<LinesProps>(({ type = 'divider', className, style }) => (
  <div className={clsx('w-auto', COMMON_CONTAINER_CLASS_NAME, className)} style={style}>
    <div className={clsx(COMMON_LINE_CLASS_NAME, type === 'line' ? 'border-b-0.5' : 'border-b')} />
    {type === 'or' && (
      <>
        <OrLabel />
        <div className={clsx(COMMON_LINE_CLASS_NAME, 'border-b')} />
      </>
    )}
  </div>
));

export const VerticalLines = memo<LinesProps>(({ type = 'divider', className, style }) => (
  <div className={clsx('h-auto flex-col', COMMON_CONTAINER_CLASS_NAME, className)} style={style}>
    <div className={clsx(COMMON_LINE_CLASS_NAME, type === 'line' ? 'border-r-0.5' : 'border-r')} />
    {type === 'or' && (
      <>
        <OrLabel />
        <div className={clsx(COMMON_LINE_CLASS_NAME, 'border-r')} />
      </>
    )}
  </div>
));

const OrLabel = memo(() => (
  <span className="text-font-small text-grey-3 font-semibold">
    <T id="or" />
  </span>
));
