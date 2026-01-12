import React, { FC, useLayoutEffect, useState } from 'react';

import CSSTransitionBase from 'react-transition-group/CSSTransition';

const CSSTransition = CSSTransitionBase as unknown as React.ComponentType<any>;

const BootAnimation: FC<PropsWithChildren> = ({ children }) => {
  const [booted, setBooted] = useState(false);

  useLayoutEffect(() => {
    setBooted(true);
  }, [setBooted]);

  return (
    <CSSTransition in={booted} timeout={200}>
      {children}
    </CSSTransition>
  );
};

export default BootAnimation;
