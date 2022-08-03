import React, { FC, useLayoutEffect, useState } from 'react';

import CSSTransition from 'react-transition-group/CSSTransition';

import { PropsWithChildren } from 'lib/props-with-children';

const BootAnimation: FC<PropsWithChildren> = ({ children }) => {
  const [booted, setBooted] = useState(false);

  useLayoutEffect(() => {
    setBooted(true);
  }, []);

  return (
    <CSSTransition in={booted} timeout={200} unmountOnExit>
      {children}
    </CSSTransition>
  );
};

export default BootAnimation;
