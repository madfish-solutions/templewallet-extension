import React, { FC, useLayoutEffect, useRef, useState } from 'react';

import clsx from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';

export const FadeTransition: FC<PropsWithChildren<{ className?: string }>> = ({ children, className }) => {
  const nodeRef = useRef(null);

  const [booted, setBooted] = useState(false);

  useLayoutEffect(() => void setBooted(true), [setBooted]);

  return (
    <CSSTransition
      /**
       * CSSTransition works by detecting changes to the "in" prop.
       * If the value of "in" changes from false to true, it triggers the "enter" transition.
       */
      in={booted}
      nodeRef={nodeRef}
      timeout={300}
      classNames={{
        enter: 'opacity-0',
        enterActive: 'opacity-100 transition ease-out duration-300'
      }}
    >
      <div ref={nodeRef} className={clsx('flex flex-col h-full', className)}>
        {children}
      </div>
    </CSSTransition>
  );
};
