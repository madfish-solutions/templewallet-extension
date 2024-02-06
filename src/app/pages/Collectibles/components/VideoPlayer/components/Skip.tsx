import React, { memo } from 'react';

import { ReactComponent as TrackSkipIcon } from '../icons/track-skip.svg';

import { Btn } from './Btn';

interface SkipProps {
  onSkip: () => void;
}

export const Skip = memo<SkipProps>(({ onSkip }) => (
  <Btn label="+ 10 seconds" onClick={onSkip}>
    <TrackSkipIcon />
  </Btn>
));
