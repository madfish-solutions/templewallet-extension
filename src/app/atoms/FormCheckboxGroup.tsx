import React, { Children, Fragment, ReactNode, memo } from 'react';

import clsx from 'clsx';

import Divider from './Divider';

interface FormCheckboxGroupProps {
  children: ReactNode | ReactNode[];
  isError?: boolean;
  className?: string;
}

export const FormCheckboxGroup = memo<FormCheckboxGroupProps>(({ className, children, isError }) => (
  <div
    className={clsx(
      'flex flex-col border-2 rounded-md p-4 bg-gray-100',
      isError ? 'border-red-600' : 'border-gray-300',
      className
    )}
  >
    {Children.map(children, (child, index) => (
      <Fragment key={index}>
        {child}
        {index < Children.count(children) - 1 && <Divider className="my-4" />}
      </Fragment>
    ))}
  </div>
));
