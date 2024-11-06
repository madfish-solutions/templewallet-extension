import React, { forwardRef, memo, useMemo } from 'react';

import clsx from 'clsx';

import { TestIDProps } from 'lib/analytics';

import { Button } from './Button';
import { IconBase } from './IconBase';

type Color = 'black' | 'blue' | 'grey';

interface Props extends TestIDProps {
  Icon?: ImportedSVGComponent;
  className?: string;
  color?: Color;
  onClick?: EmptyFn;
}

export const TextButton = memo(
  forwardRef<HTMLButtonElement, PropsWithChildren<Props>>(
    ({ Icon, color, onClick, testID, testIDProperties, children, className }, ref) => {
      const { textClassName, iconClassName } = useMemo(() => {
        switch (color) {
          case 'black':
            return {
              textClassName: 'focus:text-black',
              iconClassName: 'text-secondary focus:text-secondary-hover'
            };
          case 'blue':
            return {
              textClassName: 'text-secondary focus:text-secondary-hover',
              iconClassName: 'text-secondary focus:text-secondary-hover'
            };
          default:
            return {
              textClassName: 'text-grey-1 focus:text-grey-2',
              iconClassName: 'text-grey-2 focus:text-grey-3'
            };
        }
      }, [color]);

      return (
        <Button
          ref={ref}
          className={clsx(
            className,
            'px-1 py-0.5 rounded flex items-center',
            color === 'grey' ? 'hover:bg-grey-4' : 'hover:bg-secondary-low'
          )}
          onClick={onClick}
          testID={testID}
          testIDProperties={testIDProperties}
        >
          <span className={clsx('text-font-description-bold', textClassName)}>{children}</span>
          {Icon && <IconBase size={12} Icon={Icon} className={iconClassName} />}
        </Button>
      );
    }
  )
);
