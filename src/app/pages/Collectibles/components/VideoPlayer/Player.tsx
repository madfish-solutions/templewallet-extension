import React, { useState, useCallback, useEffect, useRef, ReactNode, forwardRef } from 'react';

import { emptyFn } from '@rnw-community/shared';
import clsx from 'clsx';

import { useAppEnv } from 'app/env';
import { combineRefs } from 'lib/ui/utils';

import { Error } from './components/Error/Error';
import { Fullscreen } from './components/Fullscreen';
import { KeyAction, KeyActionHandle } from './components/KeyAction/KeyAction';
import { Playback } from './components/Playback';
import { Progress } from './components/Progress';
import { Rewind } from './components/Rewind';
import { Skip } from './components/Skip';
import { Time } from './components/Time';
import { Volume } from './components/Volume';
import { useTimeout } from './hooks/use-timeout';
import { formatTime } from './utils/format-time';

import './Player.css';

interface Props {
  src: string;
  audioPlayer?: boolean;
  autoPlay?: boolean;
  hidden?: boolean;
  loop?: boolean;
  className?: string;
  audioPoster?: ReactNode;
  onLoadedMetadata?: EmptyFn;
  onError?: EmptyFn;
}

export const Player = forwardRef<HTMLVideoElement | HTMLAudioElement, Props>(
  (
    {
      src,
      audioPlayer = false,
      autoPlay = true,
      hidden = false,
      loop,
      className,
      audioPoster,
      onLoadedMetadata = emptyFn,
      onError = emptyFn
    },
    ref
  ) => {
    const [displayControls, setDisplayControls] = useState(true);
    const [playbackState, setPlaybackState] = useState(false);
    const [volumeState, setVolumeState] = useState(0.5);
    const [currentProgress, setCurrentProgress] = useState(0);
    const [seekProgress, setSeekProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [seekTooltip, setSeekTooltip] = useState('00:00');
    const [seekTooltipPosition, setSeekTooltipPosition] = useState('');
    const [currentTimeUI, setCurrentTimeUI] = useState('00:00');
    const [remainedTimeUI, setRemainedTimeUI] = useState('00:00');
    const [fullscreenState, setFullscreenState] = useState(false);
    const [volumeKeyAction, setVolumeKeyAction] = useState(false);
    const [playerError, setPlayerError] = useState<MediaError | null>(null);

    const playerRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const keyActionRef = useRef<KeyActionHandle>(null);

    const playPromise = useRef<Promise<void>>();
    const volumeData = useRef(volumeState || 1);
    const progressSeekData = useRef(0);

    const [setControlsTimeout] = useTimeout();
    const [setKeyActionVolumeTimeout] = useTimeout();

    const { popup } = useAppEnv();

    /**
     * TOGGLE SHOWING CONTROLS
     */

    const hideControlsHandler = useCallback(() => {
      const player = playerRef.current!;

      if (player.paused) {
        return;
      }

      setDisplayControls(false);
    }, []);

    const showControlsHandler = useCallback(() => {
      const player = playerRef.current!;

      setDisplayControls(true);

      if (player.paused) {
        return;
      }

      setControlsTimeout(() => {
        hideControlsHandler();
      }, 2000);
    }, [hideControlsHandler, setControlsTimeout]);

    /**
     * PLAYBACK
     */

    const togglePlayHandler = useCallback(() => {
      const player = playerRef.current!;

      if (player.paused || player.ended) {
        playPromise.current = player.play();
        return;
      }

      if (playPromise.current) {
        playPromise.current.then(() => {
          player.pause();
        });
      } else {
        player.pause();
      }
    }, []);

    const playHandler = useCallback(() => {
      setPlaybackState(true);
      showControlsHandler();
    }, [showControlsHandler]);

    const pauseHandler = useCallback(() => {
      setPlaybackState(false);
      showControlsHandler();
    }, [showControlsHandler]);

    /**
     * VOLUME
     */

    const volumeInputHandler = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const player = playerRef.current!;

      player.volume = +event.target.value;
    }, []);

    const volumeChangeHandler = useCallback(() => {
      const player = playerRef.current!;

      setVolumeState(player.volume);

      if (player.volume === 0) {
        player.muted = true;
      } else {
        player.muted = false;
        volumeData.current = player.volume;
      }
    }, [setVolumeState]);

    const toggleMuteHandler = useCallback(() => {
      const player = playerRef.current!;

      if (player.volume !== 0) {
        volumeData.current = player.volume;
        player.volume = 0;
        setVolumeState(0);
      } else {
        player.volume = volumeData.current;
        setVolumeState(volumeData.current);
      }
    }, [setVolumeState]);

    /**
     * TIME
     */

    const timeChangeHandler = useCallback(() => {
      const player = playerRef.current!;

      const duration = player.duration || 0;
      const currentTime = player.currentTime || 0;

      // Progress
      setCurrentProgress((currentTime / duration) * 100);
      setSeekProgress(currentTime);

      // Time
      const formattedCurrentTime = formatTime(Math.round(currentTime));
      const formattedRemainedTime = formatTime(Math.round(duration) - Math.round(currentTime));

      setCurrentTimeUI(formattedCurrentTime);
      setRemainedTimeUI(formattedRemainedTime);
    }, []);

    /**
     * SEEK
     */

    const seekMouseMoveHandler = useCallback((event: React.MouseEvent) => {
      const player = playerRef.current!;

      const rect = event.currentTarget.getBoundingClientRect();
      const skipTo = (event.nativeEvent.offsetX / rect.width) * player.duration;

      progressSeekData.current = skipTo;

      let formattedTime: string;

      if (skipTo > player.duration) {
        formattedTime = formatTime(player.duration);
      } else if (skipTo < 0) {
        formattedTime = '00:00';
      } else {
        formattedTime = formatTime(skipTo);
        setSeekTooltipPosition(`${event.nativeEvent.offsetX}px`);
      }

      setSeekTooltip(formattedTime);
    }, []);

    const seekInputHandler = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const player = playerRef.current!;

      const skipTo = progressSeekData.current || +event.target.value;

      player.currentTime = skipTo;
      setCurrentProgress((skipTo / player.duration) * 100);
      setSeekProgress(skipTo);
    }, []);

    /**
     * REWIND & SKIP
     */

    const rewindHandler = useCallback(() => {
      const player = playerRef.current!;

      player.currentTime -= 10;

      const rewindContainer = keyActionRef.current!.rewind;
      const rewindElement = rewindContainer.firstElementChild as HTMLElement;

      rewindContainer.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 1 }, { opacity: 0 }], {
        duration: 1000,
        easing: 'ease-out',
        fill: 'forwards'
      });
      rewindElement.animate(
        [
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: `translateX(-20%)` }
        ],
        {
          duration: 1000,
          easing: 'ease-in-out',
          fill: 'forwards'
        }
      );
    }, []);

    const skipHandler = useCallback(() => {
      const video = playerRef.current!;

      video.currentTime += 10;

      const forwardContainer = keyActionRef.current!.skip;
      const forwardElement = forwardContainer.firstElementChild as HTMLElement;

      forwardContainer.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 1 }, { opacity: 0 }], {
        duration: 1000,
        easing: 'ease-out',
        fill: 'forwards'
      });
      forwardElement.animate(
        [
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: `translateX(20%)` }
        ],
        {
          duration: 1000,
          easing: 'ease-in-out',
          fill: 'forwards'
        }
      );
    }, []);

    /**
     * FULLSCREEN
     */

    const toggleFullscreenHandler = useCallback(() => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current!.requestFullscreen();
      }
    }, []);

    const fullscreenChangeHandler = useCallback(() => {
      if (document.fullscreenElement) {
        setFullscreenState(true);
      } else {
        setFullscreenState(false);
      }
    }, []);

    /**
     * KEYBOARD SHORTCUTS
     */

    const keyEventHandler = useCallback(
      (event: KeyboardEvent) => {
        const player = playerRef.current!;
        const activeElement = document.activeElement;

        if (
          !activeElement ||
          (activeElement.localName === 'input' && (activeElement as HTMLInputElement).type !== 'range') ||
          activeElement.localName === 'textarea'
        ) {
          return;
        }

        const { key } = event;

        switch (key) {
          case 'ArrowLeft':
            event.preventDefault();
            rewindHandler();
            break;
          case 'ArrowRight':
            event.preventDefault();
            skipHandler();
            break;
          case 'ArrowUp':
            event.preventDefault();
            if (player.volume + 0.05 > 1) {
              player.volume = 1;
            } else {
              player.volume = +(player.volume + 0.05).toFixed(2);
            }

            setVolumeKeyAction(true);
            setKeyActionVolumeTimeout(() => {
              setVolumeKeyAction(false);
            }, 1500);

            break;
          case 'ArrowDown':
            event.preventDefault();
            if (player.volume - 0.05 < 0) {
              player.volume = 0;
            } else {
              player.volume = +(player.volume - 0.05).toFixed(2);
            }

            setVolumeKeyAction(true);
            setKeyActionVolumeTimeout(() => {
              setVolumeKeyAction(false);
            }, 1500);

            break;
          case ' ':
            event.preventDefault();
            togglePlayHandler();
            break;
        }
      },
      [togglePlayHandler, rewindHandler, skipHandler, setKeyActionVolumeTimeout]
    );

    /**
     * LOAD
     */

    const loadedHandler = useCallback(() => {
      const player = playerRef.current!;

      player.volume = volumeState;
      player.playbackRate = 1;

      setDuration(player.duration);
      timeChangeHandler();

      document.addEventListener('keydown', keyEventHandler);
      document.addEventListener('fullscreenchange', fullscreenChangeHandler);

      onLoadedMetadata();

      autoPlay && (playPromise.current = player.play());
    }, [autoPlay, volumeState, timeChangeHandler, keyEventHandler, fullscreenChangeHandler, onLoadedMetadata]);

    /**
     * ERROR HANDLER
     */

    const errorHandler = useCallback(() => {
      const player = playerRef.current!;

      player.error && setPlayerError(player.error);
      onError();
    }, [onError]);

    /**
     * INITIATE PLAYER
     */

    useEffect(() => {
      return () => {
        document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
        document.removeEventListener('keydown', keyEventHandler);
      };
    }, [fullscreenChangeHandler, keyEventHandler]);

    /**
     * RENDER
     */

    return (
      <div
        className={clsx('vp-container', hidden && 'hidden-container', className)}
        ref={containerRef}
        style={{ cursor: displayControls ? 'default' : 'none' }}
        onMouseMove={showControlsHandler}
        onMouseLeave={hideControlsHandler}
      >
        {audioPlayer && (
          <>
            <audio
              ref={combineRefs(ref, playerRef)}
              src={src}
              controls={false}
              loop={loop}
              onLoadedMetadata={loadedHandler}
              onClick={togglePlayHandler}
              onPlay={playHandler}
              onPause={pauseHandler}
              onVolumeChange={volumeChangeHandler}
              onTimeUpdate={timeChangeHandler}
              onDoubleClick={toggleFullscreenHandler}
              onError={errorHandler}
            />
            {audioPoster}
          </>
        )}
        {!audioPlayer && (
          <video
            ref={combineRefs(ref, playerRef)}
            src={src}
            controls={false}
            loop={loop}
            onLoadedMetadata={loadedHandler}
            onClick={togglePlayHandler}
            onPlay={playHandler}
            onPause={pauseHandler}
            onVolumeChange={volumeChangeHandler}
            onTimeUpdate={timeChangeHandler}
            onDoubleClick={toggleFullscreenHandler}
            onError={errorHandler}
          />
        )}
        <KeyAction ref={keyActionRef} on={volumeKeyAction} volume={volumeState} />
        <Error error={playerError} />
        <div className={`vp-controls${!displayControls ? ' hide' : ''}`}>
          <div className="vp-controls__header">
            <Time time={currentTimeUI} />
            <Progress
              currentProgress={currentProgress}
              videoDuration={duration}
              seekProgress={seekProgress}
              seekTooltip={seekTooltip}
              seekTooltipPosition={seekTooltipPosition}
              onHover={seekMouseMoveHandler}
              onSeek={seekInputHandler}
            />
            <Time time={remainedTimeUI} />
          </div>
          <div className="vp-controls__body">
            <div>
              <Volume volume={volumeState} onToggle={toggleMuteHandler} onSeek={volumeInputHandler} />
            </div>
            <div>
              <Rewind onRewind={rewindHandler} />
              <Playback isPlaying={playbackState} onToggle={togglePlayHandler} />
              <Skip onSkip={skipHandler} />
            </div>
            <div>
              <Fullscreen isFullscreen={fullscreenState} disabled={popup} onToggle={toggleFullscreenHandler} />
            </div>
          </div>
        </div>
      </div>
    );
  }
);
