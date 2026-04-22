import { FC, useLayoutEffect, useRef } from 'react';

import CSSTransition from 'react-transition-group/CSSTransition';

import { useBooleanState } from 'lib/ui/hooks';

const BootAnimation: FC<PropsWithChildren> = ({ children }) => {
  const nodeRef = useRef(null);

  const [booted, setBooted] = useBooleanState(false);

  useLayoutEffect(setBooted, [setBooted]);

  return (
    <CSSTransition nodeRef={nodeRef} in={booted} timeout={200}>
      <div ref={nodeRef} className="flex flex-col h-full">
        {children}
      </div>
    </CSSTransition>
  );
};

export default BootAnimation;
