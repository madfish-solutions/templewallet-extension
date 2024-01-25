import React, { memo } from 'react';

import { ReactComponent as FullscreenExitIcon } from '../icons/fullscreen-exit.svg';
import { ReactComponent as FullscreenIcon } from '../icons/fullscreen.svg';

import { Btn } from './Btn';

interface FullscreenProps {
  isFullscreen: boolean;
  onToggle: () => void;
}

export const Fullscreen = memo<FullscreenProps>(({ isFullscreen, onToggle }) => (
  <Btn label={isFullscreen ? 'Fullscreen Off' : 'Fullscreen'} onClick={onToggle}>
    {!isFullscreen && <FullscreenIcon />}
    {isFullscreen && <FullscreenExitIcon />}
  </Btn>
));
