import React, { FC, ReactNode } from 'react';

import classNames from 'clsx';

import { PropsWithChildren } from 'lib/props-with-children';

interface TemplateProps extends PropsWithChildren {
  title: ReactNode;
}

export const Template: FC<TemplateProps> = ({ title, children }) => (
  <div className="py-4">
    <h1 className={classNames('mb-2', 'text-2xl font-light text-gray-700 text-center')}>{title}</h1>
    <hr className="my-4" />
    {children}
  </div>
);
