import React, { memo } from 'react';

interface StakingStatsEntryProps {
  name: string;
  value: ReactChildren;
  tooltip?: ReactChildren;
}

export const StakingStatsEntry = memo<StakingStatsEntryProps>(({ name, value, tooltip }) => (
  <div className="flex flex-1 flex-col gap-0.5">
    {tooltip ? (
      <div className="flex items-center">
        <span className="text-font-description text-grey-2">{name}:</span>
        {tooltip}
      </div>
    ) : (
      <span className="text-font-description text-grey-2">{name}:</span>
    )}
    <span className="text-font-num-12">{value}</span>
  </div>
));
