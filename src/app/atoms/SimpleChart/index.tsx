import React, { FC, useMemo } from 'react';

import { Area, AreaChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface SimpleChartProps {
  values?: number[];
  className?: string;
  /**
   * Height of the chart container in pixels.
   *
   * Defaults to 64 to match the Earn deposits card design.
   */
  height?: number;
}

export const SimpleChart: FC<SimpleChartProps> = ({ values, className, height = 64 }) => {
  const data = useMemo(() => (values ?? []).map((value, index) => ({ index, value })), [values]);

  if (!data.length) {
    return null;
  }

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="simpleChartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2D6CDF" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#2D6CDF" stopOpacity={0} />
            </linearGradient>
          </defs>

          <Area type="monotone" dataKey="value" stroke="none" fill="url(#simpleChartFill)" isAnimationActive={false} />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#2D6CDF"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />

          <Tooltip cursor={false} contentStyle={{ display: 'none' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
