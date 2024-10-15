import React, { forwardRef, memo } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms';

interface Props {
  firstTitle: string;
  secondTitle: string;
  activeSecond?: boolean;
  className?: string;
  onFirstClick: EmptyFn;
  onSecondClick: EmptyFn;
}

export const SimpleSegmentControl = memo(
  forwardRef<HTMLDivElement, Props>(
    ({ firstTitle, secondTitle, activeSecond, className, onFirstClick, onSecondClick }, ref) => (
      <div ref={ref} className={clsx('p-0.5 rounded-md bg-lines', className)}>
        <div className="w-full flex gap-x-0.5 relative">
          {/* Slider */}
          <div
            className={clsx(
              'absolute h-full bg-white rounded-5 shadow-bottom duration-400 ease-out',
              activeSecond ? 'left-1/2 right-0' : 'left-0 right-1/2'
            )}
          />

          <Button
            disabled={!activeSecond}
            className={clsx('flex-1 relative p-1 text-font-num-bold-12', !activeSecond && 'text-primary')}
            onClick={onFirstClick}
          >
            {firstTitle}
          </Button>

          <Button
            disabled={activeSecond}
            className={clsx('flex-1 relative p-1 text-font-num-bold-12', activeSecond && 'text-primary')}
            onClick={onSecondClick}
          >
            {secondTitle}
          </Button>
        </div>
      </div>
    )
  )
);
