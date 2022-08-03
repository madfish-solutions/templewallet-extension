import React, { FC, useLayoutEffect, useState, useTransition } from 'react';

import CSSTransition from 'react-transition-group/CSSTransition';

import { PropsWithChildren } from 'lib/props-with-children';

const BootAnimation: FC<PropsWithChildren> = ({ children }) => {
  const [, startTransition] = useTransition();
  const [booted, setBooted] = useState(false);

  useLayoutEffect(() => {
    startTransition(() => setBooted(true));
  }, []);

  return (
    <CSSTransition in={booted} timeout={200}>
      {children}
    </CSSTransition>
  );
};

export default BootAnimation;
