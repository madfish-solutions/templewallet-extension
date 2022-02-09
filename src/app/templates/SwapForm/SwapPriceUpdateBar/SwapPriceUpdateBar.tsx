import React, { FC, useEffect, useMemo, useRef, useState } from 'react';

import { BlockInterface } from 'swap-router-sdk';

interface Props {
  lastUpdateBlock: BlockInterface;
}

export const BLOCK_DURATION = 30000;

export const SwapPriceUpdateBar: FC<Props> = ({ lastUpdateBlock }) => {
  const [nowTimestamp, setNowTimestamp] = useState(new Date().getTime());
  const blockEndTimestamp = useMemo(
    () => new Date(lastUpdateBlock.header.timestamp).getTime() + BLOCK_DURATION,
    [lastUpdateBlock.header.timestamp]
  );

  const prevWidthPercentRef = useRef(0);

  const state = useMemo(() => {
    const millisecondsLeft = blockEndTimestamp - nowTimestamp;

    const secondsLeft = Math.floor(millisecondsLeft / 1000);

    const widthPercent = Math.max(0, Math.floor((100 / BLOCK_DURATION) * (millisecondsLeft - 1000)));
    const transitionTime = widthPercent < prevWidthPercentRef.current ? '1s' : '0s';
    prevWidthPercentRef.current = widthPercent;

    const text = secondsLeft >= 0 ? `in ${secondsLeft}s` : `is late for ${Math.abs(secondsLeft)}s`;

    return {
      width: `${widthPercent}%`,
      transition: `${transitionTime} linear`,
      text
    };
  }, [blockEndTimestamp, nowTimestamp]);

  useEffect(() => {
    const interval = setInterval(() => setNowTimestamp(new Date().getTime()), 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-4 bg-orange-500 bg-opacity-10 mb-6 rounded-sm overflow-hidden">
      <div
        style={{ width: state.width, transition: state.transition }}
        className="absolute top-0 h-full bg-orange-500"
      />
      <p className="absolute left-0 right-0 text-center text-xs text-gray-700">Rates update {state.text}</p>
    </div>
  );
};
