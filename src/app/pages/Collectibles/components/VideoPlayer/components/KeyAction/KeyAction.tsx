import React, { forwardRef, memo, useImperativeHandle, useRef } from 'react';

import { CSSTransition } from 'react-transition-group';

import { ReactComponent as TrackRewindIcon } from '../../icons/track-rewind.svg';
import { ReactComponent as TrackSkipIcon } from '../../icons/track-skip.svg';
import { ReactComponent as VolumeHighIcon } from '../../icons/volume-high.svg';
import { ReactComponent as VolumeLowIcon } from '../../icons/volume-low.svg';
import { ReactComponent as VolumeMiddleIcon } from '../../icons/volume-middle.svg';
import { ReactComponent as VolumeMuteIcon } from '../../icons/volume-mute.svg';

import './KeyAction.css';

export interface KeyActionHandle {
  rewind: HTMLDivElement;
  skip: HTMLDivElement;
}

interface KeyActionProps {
  on: boolean;
  volume: number;
}

export const KeyAction = memo(
  forwardRef<KeyActionHandle, KeyActionProps>(({ on, volume }, ref) => {
    const rewindRef = useRef<HTMLDivElement>(null);
    const skipRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      get rewind() {
        return rewindRef.current!;
      },
      get skip() {
        return skipRef.current!;
      }
    }));

    return (
      <div className="vp-key-action">
        <CSSTransition in={on} classNames="vp-key-volume" timeout={300} mountOnEnter unmountOnExit>
          <div className="vp-key-action__volume">
            <div className="vp-key-action__volume__container">
              <div className="vp-key-action__volume__icon">
                {volume > 0.7 && <VolumeHighIcon />}
                {volume <= 0.7 && volume > 0.3 && <VolumeMiddleIcon />}
                {volume <= 0.3 && volume > 0 && <VolumeLowIcon />}
                {volume === 0 && <VolumeMuteIcon />}
              </div>
              <div className="vp-key-action__volume__range">
                <div className="vp-key-action__volume__range--background" />
                <div className="vp-key-action__volume__range--current" style={{ width: `${volume * 100}%` }} />
              </div>
            </div>
          </div>
        </CSSTransition>

        <div className="vp-key-action__progress rewind" ref={rewindRef}>
          <div className="vp-key-action__progress__container">
            <TrackRewindIcon />
            <span>- 10 seconds</span>
          </div>
        </div>
        <div className="vp-key-action__progress skip" ref={skipRef}>
          <div className="vp-key-action__progress__container">
            <TrackSkipIcon />
            <span>+ 10 seconds</span>
          </div>
        </div>
      </div>
    );
  })
);
