import React from 'react';

import type { ChartPoint } from 'lib/temple/back/web-widgets/fetch-token-market';

interface MiniChartProps {
  data: ChartPoint[];
  width: number;
  height: number;
  highLabel?: string;
  lowLabel?: string;
}

// The shared recharts SimpleChart relies on ResponsiveContainer measuring its parent,
// which returns 0 inside the web-widget shadow DOM, so it paints nothing here.
// This renders deterministically from a fixed coordinate space scaled to the box via viewBox
const PADDING_TOP = 16;
const PADDING_BOTTOM = 18;
const STROKE = '#2D6CDF';
const LABEL_COLOR = '#151618';

export const MiniChart = ({ data, width, height, highLabel, lowLabel }: MiniChartProps) => {
  if (data.length < 2) return null;

  let maxIndex = 0;
  let minIndex = 0;
  data.forEach((point, index) => {
    if (point.value > data[maxIndex].value) maxIndex = index;
    if (point.value < data[minIndex].value) minIndex = index;
  });

  const min = data[minIndex].value;
  const max = data[maxIndex].value;
  const range = max - min || 1;

  const innerHeight = height - PADDING_TOP - PADDING_BOTTOM;
  const toX = (index: number) => (index / (data.length - 1)) * width;
  const toY = (value: number) => PADDING_TOP + innerHeight - ((value - min) / range) * innerHeight;

  const points = data.map((point, index) => `${toX(index).toFixed(2)},${toY(point.value).toFixed(2)}`);
  const areaPath = `M0,${height} L${points.join(' L')} L${width},${height} Z`;

  // Anchor the label toward the inside so it never clips at the left/right edges.
  const anchor = (x: number) => (x < width / 2 ? 'start' : 'end');
  const labelX = (x: number) => (x < width / 2 ? x + 2 : x - 2);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      <defs>
        <linearGradient id="tw-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={STROKE} stopOpacity={0.35} />
          <stop offset="100%" stopColor={STROKE} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#tw-spark-fill)" />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={STROKE}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {highLabel ? (
        <text
          x={labelX(toX(maxIndex))}
          y={11}
          textAnchor={anchor(toX(maxIndex))}
          fontFamily="Rubik, sans-serif"
          fontSize={10}
          fill={LABEL_COLOR}
        >
          {highLabel}
        </text>
      ) : null}
      {lowLabel ? (
        <text
          x={labelX(toX(minIndex))}
          y={height - 4}
          textAnchor={anchor(toX(minIndex))}
          fontFamily="Rubik, sans-serif"
          fontSize={10}
          fill={LABEL_COLOR}
        >
          {lowLabel}
        </text>
      ) : null}
    </svg>
  );
};
