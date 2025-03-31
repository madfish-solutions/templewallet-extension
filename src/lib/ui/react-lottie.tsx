// Original: https://github.com/chenqingspring/react-lottie/blob/master/src/index.js
import React from 'react';

import { noop } from 'lodash';
import lottie, { AnimationDirection, AnimationItem, AnimationSegment, RendererType } from 'lottie-web';

interface Options {
  /**
   * Defines if the animation should play only once or repeatedly in an endless loop
   * or the number of loops that should be completed before the animation ends
   */
  loop?: boolean | number | undefined;
  /**
   * Defines if the animation should immediately play when the component enters the DOM
   */
  autoplay?: boolean | undefined;
  /**
   * The JSON data exported from Adobe After Effects using the Bodymovin plugin
   */
  animationData: any;
  rendererSettings?:
    | {
        preserveAspectRatio?: string | undefined;
        /**
         * The canvas context
         */
        context?: any;
        scaleMode?: any;
        clearCanvas?: boolean | undefined;
        /**
         * Loads DOM elements when needed. Might speed up initialization for large number of elements. Only with SVG renderer.
         */
        progressiveLoad?: boolean | undefined;
        /**
         * Hides elements when opacity reaches 0. Only with SVG renderer.
         * @default true
         */
        hideOnTransparent?: boolean | undefined;
        className?: string | undefined;
      }
    | undefined;
}

interface EventListener {
  /**
   * The event sent by Lottie
   */
  eventName:
    | 'complete'
    | 'loopComplete'
    | 'enterFrame'
    | 'segmentStart'
    | 'config_ready'
    | 'data_ready'
    | 'loaded_images'
    | 'DOMLoaded'
    | 'destroy';
  /**
   * A callback that will be executed when the given eventName is received
   */
  callback: () => void;
}

interface LottieProps {
  /**
   * Object representing animation settings
   */
  options: Options;
  /**
   * Height size in pixels
   * @default '100%'
   */
  height?: number | string | undefined;
  /**
   * Width size in pixels
   * @default '100%'
   */
  width?: number | string | undefined;
  /**
   * Describes if the animation must be in stopped mode
   */
  isStopped?: boolean | undefined;
  /**
   * Describes if the animation must be in paused mode
   */
  isPaused?: boolean | undefined;
  /**
   * Array of objects containing eventName and a callback function that will be registered as eventListeners on the animation object.
   * Refer to Lottie documentation for a list of available events.
   */
  eventListeners?: readonly EventListener[] | undefined;
  segments?: AnimationSegment[] | undefined;
  speed?: number | undefined;
  direction?: AnimationDirection | undefined;
  ariaRole?: string | 'button' | undefined;
  ariaLabel?: string | 'animation' | undefined;
  isClickToPauseDisabled?: boolean | undefined;
  title?: string | undefined;
  style?: React.CSSProperties | undefined;
}

export class Lottie extends React.Component<LottieProps> {
  private el: HTMLDivElement | null = null;
  private options: (Options & { container: HTMLDivElement; renderer: RendererType; segments: boolean }) | null = null;
  private anim: AnimationItem | null = null;

  componentDidMount() {
    const { options, eventListeners, segments } = this.props;

    const { loop, autoplay, animationData, rendererSettings } = options;

    this.options = {
      container: this.el!,
      renderer: 'svg',
      loop: loop !== false,
      autoplay: autoplay !== false,
      segments: Boolean(segments),
      animationData,
      rendererSettings
    };

    this.options = { ...this.options, ...options };
    this.anim = lottie.loadAnimation(this.options);
    this.registerEvents(eventListeners);
    this.setSpeed();
  }

  UNSAFE_componentWillUpdate(nextProps: LottieProps) {
    if (!this.options) {
      return;
    }

    /* Recreate the animation handle if the data is changed */
    if (this.options.animationData !== nextProps.options.animationData) {
      this.deRegisterEvents(this.props.eventListeners);
      this.destroy();
      this.options = { ...this.options, ...nextProps.options };
      this.anim = lottie.loadAnimation(this.options);
      this.registerEvents(nextProps.eventListeners);
    }
  }

  componentDidUpdate() {
    if (this.props.isStopped) {
      this.stop();
    } else if (this.props.segments) {
      this.playSegments();
    } else {
      this.play();
    }

    this.pause();
    this.setSpeed();
    this.setDirection();
  }

  componentWillUnmount() {
    this.deRegisterEvents(this.props.eventListeners);
    this.destroy();
    if (this.options) {
      this.options.animationData = null;
    }
    this.anim = null;
  }

  setSpeed() {
    this.anim?.setSpeed(this.props.speed ?? 1);
  }

  setDirection() {
    this.anim?.setDirection(this.props.direction ?? 1);
  }

  play() {
    this.anim?.play();
  }

  playSegments() {
    this.anim?.playSegments(this.props.segments ?? []);
  }

  stop() {
    this.anim?.stop();
  }

  pause() {
    if (!this.anim) {
      return;
    }

    if (this.props.isPaused && !this.anim.isPaused) {
      this.anim.pause();
    } else if (!this.props.isPaused && this.anim.isPaused) {
      this.anim.pause();
    }
  }

  destroy() {
    this.anim?.destroy();
  }

  registerEvents(eventListeners: readonly EventListener[] = []) {
    eventListeners.forEach(eventListener => {
      this.anim?.addEventListener(eventListener.eventName, eventListener.callback);
    });
  }

  deRegisterEvents(eventListeners: readonly EventListener[] = []) {
    eventListeners.forEach(eventListener => {
      this.anim?.removeEventListener(eventListener.eventName, eventListener.callback);
    });
  }

  handleClickToPause = () => {
    // The pause() method is for handling pausing by passing a prop isPaused
    // This method is for handling the ability to pause by clicking on the animation
    if (!this.anim) {
      return;
    }

    if (this.anim.isPaused) {
      this.anim.play();
    } else {
      this.anim.pause();
    }
  };

  render() {
    const {
      width,
      height,
      ariaRole = 'button',
      ariaLabel = 'animation',
      isClickToPauseDisabled,
      title = ''
    } = this.props;

    const getSize = (initial: string | number | undefined) => {
      let size;

      if (typeof initial === 'number') {
        size = `${initial}px`;
      } else {
        size = initial || '100%';
      }

      return size;
    };

    const lottieStyles = {
      width: getSize(width),
      height: getSize(height),
      overflow: 'hidden',
      margin: '0 auto',
      outline: 'none',
      ...this.props.style
    };

    const onClickHandler = isClickToPauseDisabled ? noop : this.handleClickToPause;

    return (
      <div
        ref={c => void (this.el = c)}
        style={lottieStyles}
        onClick={onClickHandler}
        title={title}
        role={ariaRole}
        aria-label={ariaLabel}
        tabIndex={0}
      />
    );
  }
}
