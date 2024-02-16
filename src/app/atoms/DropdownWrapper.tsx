import React, { FC, HTMLAttributes, useCallback, useRef, useState } from 'react';

import classNames from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';

type DropdownWrapperProps = HTMLAttributes<HTMLDivElement> & {
  opened: boolean;
  design?: Design;
  hiddenOverflow?: boolean;
  scaleAnimation?: boolean;
};

const DESIGN_CLASS_NAMES = {
  light: 'bg-white border-gray-300',
  dark: 'bg-gray-910 border-gray-850'
};

const ANIMATION_DURATION = 100;

type Design = keyof typeof DESIGN_CLASS_NAMES;

const DropdownWrapper: FC<DropdownWrapperProps> = ({
  opened,
  design = 'light',
  hiddenOverflow = true,
  scaleAnimation = true,
  className,
  style = {},
  ...rest
}) => {
  // Recommended: https://reactcommunity.org/react-transition-group/transition#Transition-prop-nodeRef
  const nodeRef = useRef(null);

  const [key, setKey] = useState(0);

  const onExiting = useCallback(() => {
    // Transition component does not propperly update, when Suspense is involved.
    // E.g. happens when new node RPC is selected & chainId is being fetched (see: `useChainIdValue` hook).
    // Status `exited` & `unmounted` never arrive in such case!
    // See: https://github.com/reactjs/react-transition-group/issues/817#issuecomment-1122997210
    // We will re-create it every time ourselves via different key.
    setTimeout(() => setKey(key => (key % 2) + 1), 2 * ANIMATION_DURATION);
  }, []);

  return (
    <CSSTransition
      nodeRef={nodeRef}
      key={key}
      in={opened}
      timeout={ANIMATION_DURATION}
      classNames={{
        enter: classNames('transform opacity-0', scaleAnimation && 'scale-95'),
        enterActive: classNames(
          'transform opacity-100',
          scaleAnimation && 'scale-100',
          'transition ease-out duration-100'
        ),
        exit: classNames('transform opacity-0', scaleAnimation && 'scale-95', 'transition ease-in duration-100')
      }}
      mountOnEnter
      unmountOnExit
      onExiting={onExiting}
    >
      <div
        ref={nodeRef}
        className={classNames(
          'mt-2 border rounded-md shadow-xl',
          hiddenOverflow && 'overflow-hidden',
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
