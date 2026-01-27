import { FC, useLayoutEffect, useMemo, useRef, useState } from 'react';

import clsx from 'clsx';
import CSSTransition, { CSSTransitionClassNames } from 'react-transition-group/CSSTransition';

type Duration = 100 | 200 | 300;

interface FadeTransitionProps extends PropsWithChildren {
  trigger?: boolean;
  duration?: Duration;
  className?: string;
  hideOnExit?: boolean;
  unmountOnExit?: boolean;
}

export const FadeTransition: FC<FadeTransitionProps> = ({
  trigger,
  duration = 300,
  className,
  hideOnExit = false,
  unmountOnExit,
  children
}) => {
  const nodeRef = useRef(null);

  const [booted, setBooted] = useState(false);

  const transitionClassNames = useMemo(() => getTransitionClassNames(duration, hideOnExit), [duration, hideOnExit]);

  useLayoutEffect(() => void setBooted(true), [setBooted]);

  return (
    <CSSTransition
      /**
       * CSSTransition works by detecting changes to the "in" prop.
       * If the value of "in" changes from false to true, it triggers the "enter" transition.
       */
      in={trigger ?? booted}
      nodeRef={nodeRef}
      timeout={duration}
      classNames={transitionClassNames}
      unmountOnExit={unmountOnExit}
    >
      <div ref={nodeRef} className={clsx('flex flex-col h-full duration', className)}>
        {children}
      </div>
    </CSSTransition>
  );
};

const INITIAL_CLASSNAMES = 'opacity-0';

const DURATION_CLASSNAME_RECORD: Record<Duration, string> = {
  100: 'duration-100',
  200: 'duration-200',
  300: 'duration-300'
};

const getTransitionClassNames = (duration: Duration, hideOnExit: boolean): CSSTransitionClassNames => {
  const durationClass = DURATION_CLASSNAME_RECORD[duration];

  if (hideOnExit) {
    return {
      enter: INITIAL_CLASSNAMES,
      enterActive: clsx('opacity-100 transition ease-out', durationClass),
      exit: clsx('opacity-0 transition ease-in', durationClass)
    };
  }

  const activeClassNames = clsx('opacity-100 transition ease-out', durationClass);

  return {
    enter: INITIAL_CLASSNAMES,
    enterActive: activeClassNames,
    exit: INITIAL_CLASSNAMES,
    exitActive: activeClassNames
  };
};
