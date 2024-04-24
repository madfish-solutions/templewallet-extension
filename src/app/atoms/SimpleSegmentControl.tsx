import React, { memo } from 'react';

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

export const SimpleSegmentControl = memo<Props>(
  ({ firstTitle, secondTitle, activeSecond, className, onFirstClick, onSecondClick }) => {
    return (
      <div className={clsx('p-0.5 rounded-md bg-toggle-gray', className)}>
        <div className="w-full flex gap-x-0.5 relative">
          {/* Slider */}
          <div
            className={clsx(
              'absolute h-full bg-white rounded-1.25 shadow-page transform duration-400 ease-in-out',
              activeSecond ? 'left-1/2 right-0' : 'left-0 right-1/2'
            )}
          />

          <Button
            disabled={!activeSecond}
            className={clsx('flex-1 relative p-1 text-xs leading-4 font-medium', !activeSecond && 'text-primary')}
            onClick={onFirstClick}
          >
            {firstTitle}
          </Button>

          <Button
            disabled={activeSecond}
            className={clsx('flex-1 relative p-1 text-xs leading-4 font-medium', activeSecond && 'text-primary')}
            onClick={onSecondClick}
          >
            {secondTitle}
          </Button>
        </div>
      </div>
    );
  }
);
