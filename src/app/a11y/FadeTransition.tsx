import React, { FC, useLayoutEffect, useRef, useState } from 'react';

import CSSTransition from 'react-transition-group/CSSTransition';

export const FadeTransition: FC<PropsWithChildren> = ({ children }) => {
  const nodeRef = useRef(null);

  const [booted, setBooted] = useState(false);

  useLayoutEffect(() => {
    setBooted(true);
  }, [setBooted]);

  return (
    <CSSTransition
      in={booted}
      nodeRef={nodeRef}
      timeout={300}
      classNames={{
        enter: 'opacity-0',
        enterActive: 'opacity-100 transition ease-out duration-300',
        exit: 'opacity-0 transition ease-in duration-300'
      }}
    >
      <div ref={nodeRef} className="flex flex-col h-full">
        {children}
      </div>
    </CSSTransition>
  );
};
