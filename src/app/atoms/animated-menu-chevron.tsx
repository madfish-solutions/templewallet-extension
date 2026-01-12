import React, { Component } from 'react';

import { animated, Spring } from '@react-spring/web';

import { ReactComponent as ChevronRightIcon } from 'app/icons/base/chevron_right.svg';

import { IconBase } from './IconBase';

interface AnimatedMenuChevronState {
  paused: boolean;
  reset: boolean;
  reverse: boolean;
}

export class AnimatedMenuChevron extends Component<object, AnimatedMenuChevronState> {
  state = {
    paused: true,
    reset: false,
    reverse: false
  };

  constructor(props: object) {
    super(props);
    this.handleHover = this.handleHover.bind(this);
    this.handleUnhover = this.handleUnhover.bind(this);
  }

  handleHover() {
    this.setState({ reset: true, paused: false, reverse: false });
  }

  handleUnhover() {
    this.setState({ reset: true, reverse: true });
  }

  componentDidUpdate() {
    if (this.state.reset) {
      this.setState({ reset: false });
    }
  }

  render() {
    const { paused, reset, reverse } = this.state;

    return (
      <Spring
        config={{ mass: 1, tension: 675, friction: 30 }}
        from={{ marginRight: '0rem' }}
        to={{ marginRight: '0.25rem' }}
        pause={paused}
        reverse={reverse}
        reset={reset}
      >
        {style => (
          <>
            <animated.div style={style}>
              <IconBase Icon={ChevronRightIcon} size={16} className="text-primary" />
            </animated.div>
          </>
        )}
      </Spring>
    );
  }
}
