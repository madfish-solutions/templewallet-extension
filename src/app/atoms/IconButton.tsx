import React, { forwardRef, memo, useMemo } from 'react';

import clsx from 'clsx';

import { TestIDProps } from 'lib/analytics';
import useTippy from 'lib/ui/useTippy';
import { combineRefs } from 'lib/ui/utils';

import { Button } from './Button';

interface Props extends TestIDProps {
  Icon: ImportedSVGComponent;
  active?: boolean;
  tooltip?: string;
  onClick?: EmptyFn;
}

export const IconButton = memo(
  forwardRef<HTMLButtonElement, Props>(({ Icon, active, tooltip, onClick, testID, testIDProperties }, ref) => {
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

    return (
      <Button
        ref={finalRef}
        className={clsx(
          'p-2 rounded-md',
          active
            ? 'bg-paper-gray text-gray-550 shadow-none'
            : clsx(
                'bg-white text-primary shadow-page',
                'hover:bg-paper-gray hover:shadow-none hover:text-primary-hover'
              )
        )}
        disabled={disabled || active}
        onClick={onClick}
        testID={testID}
        testIDProperties={testIDProperties}
      >
        <Icon className="h-4 w-4 stroke-current fill-current" />
      </Button>
    );
  })
);
