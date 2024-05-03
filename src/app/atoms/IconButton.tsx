import React, { forwardRef, memo, useMemo } from 'react';

import clsx from 'clsx';

import { TestIDProps } from 'lib/analytics';
import useTippy from 'lib/ui/useTippy';
import { combineRefs } from 'lib/ui/utils';

import { Button } from './Button';
import { IconBase } from './IconBase';

interface Props extends TestIDProps {
  Icon: ImportedSVGComponent;
  design?: 'blue' | 'orange' | 'red';
  active?: boolean;
  tooltip?: string;
  onClick?: EmptyFn;
}

export const IconButton = memo(
  forwardRef<HTMLButtonElement, Props>(({ Icon, design, active, tooltip, onClick, testID, testIDProperties }, ref) => {
    const disabled = !onClick;

    const tippyProps = useMemo(
      () => ({
        trigger: tooltip ? 'mouseenter' : '__SOME_INVALID_VALUE__',
        hideOnClick: true,
        content: tooltip,
        animation: 'shift-away-subtle'
      }),
      [tooltip]
    );

    const tippyRef = useTippy<HTMLButtonElement>(tippyProps);

    const finalRef = useMemo(() => combineRefs<HTMLButtonElement>(ref, tippyRef), [ref, tippyRef]);

    const designClassName = useMemo(() => {
      if (active) return 'bg-grey-4 text-grey-1 shadow-none';

      switch (design) {
        case 'blue':
          return clsx('bg-secondary-low text-secondary', 'hover:bg-secondary-hover-low hover:text-secondary-hover');
        case 'orange':
          return clsx('bg-primary-low text-primary', 'hover:bg-primary-hover-low hover:text-primary-hover');
        case 'red':
          return clsx('bg-error text-error-low', 'hover:bg-error-low-hover hover:text-error-hover');
        default:
          return clsx(
            'bg-white text-primary shadow-bottom',
            'hover:bg-grey-4 hover:shadow-none hover:text-primary-hover'
          );
      }
    }, [active, design]);

    return (
      <Button
        ref={finalRef}
        className={clsx('p-1 rounded-md', designClassName)}
        disabled={disabled || active}
        onClick={onClick}
        testID={testID}
        testIDProperties={testIDProperties}
      >
        <IconBase size={16} Icon={Icon} />
      </Button>
    );
  })
);
