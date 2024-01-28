import React, { memo } from 'react';

import { ReactComponent as FullscreenExitIcon } from '../icons/fullscreen-exit.svg';
import { ReactComponent as FullscreenIcon } from '../icons/fullscreen.svg';

import { Btn } from './Btn';

interface FullscreenProps {
  isFullscreen: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const Fullscreen = memo<FullscreenProps>(({ isFullscreen, onToggle, disabled = false }) => (
  <Btn label={isFullscreen ? 'Fullscreen Off' : 'Fullscreen'} disabled={disabled} onClick={onToggle}>
    {disabled ? <FullscreenIcon stroke="#858585" /> : isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
  </Btn>
));
