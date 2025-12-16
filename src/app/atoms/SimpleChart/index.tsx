import React from 'react';

import { Line, AreaChart, Area, Tooltip } from 'recharts';

// example
const rawPrices = [
  [1711843200000, 69702.3087473573],
  [1711929600000, 71246.9514406015],
  [1711983682000, 68887.7495158568]
];

// Convert to Recharts format
const data = rawPrices.map(([timestamp, price]) => ({
  time: timestamp,
  price: price
}));

export const SimpleChart = () => {
  return (
    <AreaChart width={300} height={100} data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
      {/* Gradient Fill */}
      <defs>
        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2D6CDF" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#2D6CDF" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Background fill under the line */}
      <Area type="monotone" dataKey="price" stroke="none" fill="url(#colorPrice)" />

      {/* Blue line */}
      <Line type="monotone" dataKey="price" stroke="#2D6CDF" strokeWidth={3} dot={false} isAnimationActive={false} />

      <Tooltip
        cursor={false}
        contentStyle={{ display: 'none' }} // minimal — hides tooltip box
      />
    </AreaChart>
  );
};
