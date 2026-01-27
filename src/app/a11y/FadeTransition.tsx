import { FC, useLayoutEffect, useRef, useState } from 'react';

import clsx from 'clsx';
import CSSTransition, { CSSTransitionClassNames } from 'react-transition-group/CSSTransition';

const INITIAL_CLASSNAMES = 'opacity-0';
const ACTIVE_CLASSNAMES = 'opacity-100 transition ease-out duration-300';

const DEFAULT_TRANSITION_CLASSNAMES = {
  enter: INITIAL_CLASSNAMES,
  enterActive: ACTIVE_CLASSNAMES,
  exit: INITIAL_CLASSNAMES,
  exitActive: ACTIVE_CLASSNAMES
};

interface FadeTransitionProps extends PropsWithChildren {
  trigger?: boolean;
  timeout?: number;
  className?: string;
  transitionClassNames?: string | CSSTransitionClassNames;
  unmountOnExit?: boolean;
}

export const FadeTransition: FC<FadeTransitionProps> = ({
  trigger,
  timeout,
  className,
  transitionClassNames,
  unmountOnExit,
  children
}) => {
  const nodeRef = useRef(null);

  const [booted, setBooted] = useState(false);

  useLayoutEffect(() => void setBooted(true), [setBooted]);

  return (
    <CSSTransition
      /**
       * CSSTransition works by detecting changes to the "in" prop.
       * If the value of "in" changes from false to true, it triggers the "enter" transition.
       */
      in={trigger ?? booted}
      nodeRef={nodeRef}
      timeout={timeout ?? 300}
      classNames={transitionClassNames ?? DEFAULT_TRANSITION_CLASSNAMES}
      unmountOnExit={unmountOnExit}
    >
      <div ref={nodeRef} className={clsx('flex flex-col h-full', className)}>
        {children}
      </div>
    </CSSTransition>
  );
};
