import React, { FC, useLayoutEffect, useRef, useState } from 'react';

import CSSTransition from 'react-transition-group/CSSTransition';

const BootAnimation: FC<PropsWithChildren> = ({ children }) => {
  const nodeRef = useRef(null);

  const [booted, setBooted] = useState(false);

  useLayoutEffect(() => {
    setBooted(true);
  }, [setBooted]);

  return (
    <CSSTransition nodeRef={nodeRef} in={booted} timeout={200}>
      <div ref={nodeRef} className="flex flex-col h-full">
        {children}
      </div>
    </CSSTransition>
  );
};

export default BootAnimation;
