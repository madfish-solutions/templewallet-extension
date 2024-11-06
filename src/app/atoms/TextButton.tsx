import React, { forwardRef, memo, useMemo } from 'react';

import clsx from 'clsx';

import { TestIDProps } from 'lib/analytics';

import { Button } from './Button';
import { IconBase } from './IconBase';

type Color = 'black' | 'blue' | 'grey';

interface Props extends TestIDProps {
  Icon: ImportedSVGComponent;
  className?: string;
  color?: Color;
  onClick?: EmptyFn;
}

export const TextButton = memo(
  forwardRef<HTMLButtonElement, PropsWithChildren<Props>>(
    ({ Icon, color, onClick, testID, testIDProperties, children, className }, ref) => {
      const { btnClassName, iconClassName } = useMemo(() => {
        switch (color) {
          case 'black':
            return {
              btnClassName: 'hover:bg-secondary-low focus:text-black',
              iconClassName: 'text-secondary focus:text-secondary-hover'
            };
          case 'grey':
            return {
              btnClassName: 'text-grey-1 hover:bg-grey-4 focus:text-grey-2',
              iconClassName: 'text-grey-2 focus:text-grey-3'
            };
          default: // blue
            return {
              btnClassName: 'text-secondary hover:bg-secondary-low focus:text-secondary-hover'
            };
        }
      }, [color]);

      return (
        <Button
          ref={ref}
          className={clsx('px-1 py-0.5 rounded flex items-center', btnClassName, className)}
          onClick={onClick}
          testID={testID}
          testIDProperties={testIDProperties}
        >
          <span className="text-font-description-bold">{children}</span>

          <IconBase size={12} Icon={Icon} className={iconClassName} />
        </Button>
      );
    }
  )
);
