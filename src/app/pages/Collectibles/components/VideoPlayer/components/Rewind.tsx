import React, { memo } from 'react';

import { ReactComponent as TrackRewindIcon } from '../icons/track-rewind.svg';

import { Btn } from './Btn';

interface RewindProps {
  onRewind: () => void;
}

export const Rewind = memo<RewindProps>(({ onRewind }) => (
  <Btn label="- 10 seconds" onClick={onRewind}>
    <TrackRewindIcon />
  </Btn>
));
