import React, { memo } from 'react';

interface TimeProps {
  time: string;
}

export const Time = memo<TimeProps>(({ time }) => (
  <time className="vp-time" dateTime={time}>
    {time}
  </time>
));
