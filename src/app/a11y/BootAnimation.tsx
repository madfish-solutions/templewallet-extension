import React, { FC, useLayoutEffect, useRef, useState } from 'react';

import CSSTransition from 'react-transition-group/CSSTransition';

import { PropsWithChildren } from 'lib/props-with-children';

const BootAnimation: FC<PropsWithChildren> = ({ children }) => {
  const firstRenderRef = useRef(true);
  const [booted, setBooted] = useState(false);

  useLayoutEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    setBooted(true);
  }, [setBooted]);

  return (
    <CSSTransition in={booted} timeout={200}>
      {children}
    </CSSTransition>
  );
};

export default BootAnimation;
