import React, { memo } from 'react';

import { ReactComponent as PauseIcon } from '../icons/pause.svg';
import { ReactComponent as PlayIcon } from '../icons/play.svg';

import { Btn } from './Btn';

interface PlaybackProps {
  isPlaying: boolean;
  onToggle: () => void;
}

export const Playback = memo<PlaybackProps>(({ isPlaying, onToggle }) => (
  <Btn label={isPlaying ? 'Pause' : 'Play'} onClick={onToggle}>
    {isPlaying ? <PauseIcon /> : <PlayIcon />}
  </Btn>
));
