import React, { forwardRef, HTMLAttributes, useImperativeHandle, useRef, useState } from 'react';

import clsx from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';

import { IS_FIREFOX } from 'lib/env';
import { useDidUpdate } from 'lib/ui/hooks';
import { PORTAL_EVENTS_LEAK_GUARD } from 'lib/ui/Portal';

interface Props extends HTMLAttributes<HTMLDivElement> {
  opened: boolean;
  design?: Design;
  scaleAnimation?: boolean;
}

const DESIGN_CLASS_NAMES = {
  light: 'bg-white border border-gray-300 shadow-xl',
  dark: 'bg-gray-910 border border-gray-850 shadow-xl',
  day: 'bg-white shadow-bottom'
};

const ANIMATION_DURATION = 100;

type Design = keyof typeof DESIGN_CLASS_NAMES;

/** TODO: See common usage cases & generalize */
const DropdownWrapper = forwardRef<HTMLDivElement, Props>(
  ({ opened, design = 'light', scaleAnimation = true, className, style = {}, ...rest }, ref) => {
    // Recommended: https://reactcommunity.org/react-transition-group/transition#Transition-prop-nodeRef
    const localRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => localRef.current!);

    const [key, setKey] = useState(0);

    useDidUpdate(() => {
      // Transition component does not propperly update, when Suspense is involved.
      // Statuses `exiting`, `exited` & `unmounted` might never arrive!
      // See: https://github.com/reactjs/react-transition-group/issues/817#issuecomment-1122997210
      // We will re-create it every time ourselves via different key.
      if (!opened) setTimeout(() => setKey(key => (key % 2) + 1), 1.5 * ANIMATION_DURATION);
    }, [opened]);

    return (
      <CSSTransition
        nodeRef={localRef}
        key={key}
        in={opened}
        timeout={ANIMATION_DURATION}
        classNames={{
          enter: clsx('opacity-0', scaleAnimation && 'scale-95'),
          enterActive: clsx('!opacity-100', scaleAnimation && '!scale-100', 'ease-out duration-100'),
          exit: clsx('opacity-0', scaleAnimation && 'scale-95', 'ease-in duration-100')
        }}
        mountOnEnter
        unmountOnExit
      >
        <div
          ref={localRef}
          className={clsx(
            'rounded-md overflow-hidden',
            IS_FIREFOX && 'grayscale-firefox-fix',
            DESIGN_CLASS_NAMES[design],
            className
          )}
          style={style}
          {...PORTAL_EVENTS_LEAK_GUARD}
          {...rest}
        />
      </CSSTransition>
    );
  }
);

export default DropdownWrapper;
