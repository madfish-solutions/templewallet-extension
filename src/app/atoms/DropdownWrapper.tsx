import React, { FC, HTMLAttributes, useRef, useState } from 'react';

import clsx from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';

import { useDidUpdate } from 'lib/ui/hooks';

interface DropdownWrapperProps extends HTMLAttributes<HTMLDivElement> {
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
const DropdownWrapper: FC<DropdownWrapperProps> = ({
  opened,
  design = 'light',
  scaleAnimation = true,
  className,
  style = {},
  ...rest
}) => {
  // Recommended: https://reactcommunity.org/react-transition-group/transition#Transition-prop-nodeRef
  const nodeRef = useRef(null);

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
      nodeRef={nodeRef}
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
        ref={nodeRef}
        className={clsx(
          'rounded-md overflow-hidden',
          process.env.TARGET_BROWSER === 'firefox' && 'grayscale-firefox-fix',
          DESIGN_CLASS_NAMES[design],
          className
        )}
        style={style}
        {...rest}
      />
    </CSSTransition>
  );
};

export default DropdownWrapper;
