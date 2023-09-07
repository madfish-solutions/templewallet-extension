import React, { FC, HTMLAttributes } from 'react';

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

type Design = keyof typeof DESIGN_CLASS_NAMES;

const DropdownWrapper: FC<DropdownWrapperProps> = ({
  opened,
  design = 'light',
  hiddenOverflow = true,
  scaleAnimation = true,
  className,
  style = {},
  ...rest
}) => (
  <CSSTransition
    in={opened}
    timeout={100}
    classNames={{
      enter: classNames('transform opacity-0', scaleAnimation && 'scale-95'),
      enterActive: classNames(
        'transform opacity-100',
        scaleAnimation && 'scale-100',
        'transition ease-out duration-100'
      ),
      exit: classNames('transform opacity-0', scaleAnimation && 'scale-95', 'transition ease-in duration-100')
    }}
    unmountOnExit
  >
    <div
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

export default DropdownWrapper;
