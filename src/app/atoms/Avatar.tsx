import React, { memo } from 'react';

import clsx from 'clsx';
import { omit } from 'lodash';

import { Button, ButtonProps } from './Button';

interface AvatarPropsBase {
  size: 24 | 32 | 60;
  elementType?: 'div' | 'button';
  borderColor?: 'secondary' | 'gray';
}

interface AvatarDivProps extends AvatarPropsBase, React.HTMLAttributes<HTMLDivElement> {
  elementType?: 'div';
}

interface AvatarButtonProps extends AvatarPropsBase, ButtonProps {
  elementType: 'button';
}

export type AvatarProps = AvatarDivProps | AvatarButtonProps;

const sizeButtonClassNames = {
  24: 'w-6 h-6 rounded-sm border p-px',
  32: 'w-8 h-8 rounded-md border p-px',
  60: 'w-15 h-15 rounded-10 border-1.5 p-[0.5px]'
};

const sizeContainerClassNames = {
  24: 'rounded-3',
  32: 'rounded-sm',
  60: 'rounded-lg border border-white'
};

export const Avatar = memo<PropsWithChildren<AvatarProps>>(
  ({ children, size, className, borderColor = size === 60 ? 'gray' : 'secondary', ...restProps }) => {
    const wrapperClassName = clsx(
      sizeButtonClassNames[size],
      className,
      borderColor === 'gray' ? 'border-grey-2' : 'border-secondary',
      borderColor === 'secondary' && size === 24 && 'hover:border-secondary-hover',
      borderColor === 'secondary' && size === 32 && 'hover:bg-secondary-low'
    );
    const content = (
      <div
        className={clsx(
          'w-full h-full overflow-hidden flex justify-center items-center',
          sizeContainerClassNames[size]
        )}
      >
        {children}
      </div>
    );

    return restProps.elementType === 'button' ? (
      <Button className={wrapperClassName} {...omit(restProps, 'elementType')}>
        {content}
      </Button>
    ) : (
      <div className={wrapperClassName} {...omit(restProps, 'elementType')}>
        {content}
      </div>
    );
  }
);
