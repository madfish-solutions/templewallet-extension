import React, { memo } from 'react';

interface ProgressAndNumbersProps {
  progress: number;
  total: number;
}

export const ProgressAndNumbers = memo<ProgressAndNumbersProps>(({ progress, total }) =>
  total === 0 ? null : (
    <div className="flex flex-col">
      <p className="text-center text-font-num-bold-14 text-grey-1">
        {progress}/{total}
      </p>
      <div className="relative w-12 h-1 bg-lines rounded-xs">
        <div
          className="absolute top-0 left-0 h-full bg-black rounded-xs"
          style={{ width: `${(progress / total) * 100}%` }}
        />
      </div>
    </div>
  )
);
