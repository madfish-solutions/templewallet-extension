import React, { FC } from 'react';

import { Area, AreaChart, Line, ResponsiveContainer } from 'recharts';

interface SimpleChartProps {
  data: { timestamp: number; value: number }[];
  className?: string;
}

export const SimpleChart: FC<SimpleChartProps> = ({ data, className }) => {
  if (!data.length) {
    return null;
  }

  return (
    <ResponsiveContainer className={className}>
      <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2D6CDF" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2D6CDF" stopOpacity={0} />
          </linearGradient>
        </defs>

        <Area type="monotone" dataKey="value" stroke="none" fill="url(#areaFill)" activeDot={false} />

        <Line type="monotone" dataKey="value" stroke="#2D6CDF" strokeWidth={2} dot={false} activeDot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
};
