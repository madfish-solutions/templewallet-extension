import React, { FC, ReactNode } from 'react';

import clsx from 'clsx';

import DocBg from 'app/a11y/DocBg';
import Logo from 'app/atoms/Logo';
import { useAppEnv } from 'app/env';

import { LAYOUT_CONTAINER_CLASSNAME } from './containers';

interface SimplePageLayoutProps extends PropsWithChildren {
  title: ReactNode;
}

const SimplePageLayout: FC<SimplePageLayoutProps> = ({ title, children }) => {
  const appEnv = useAppEnv();

  return (
    <>
      {!appEnv.fullPage && <DocBg bgClassName="bg-secondary-low" />}

      <div
        className={clsx(
          LAYOUT_CONTAINER_CLASSNAME,
          'min-h-screen flex flex-col',
          !appEnv.fullPage && 'bg-primary-white'
        )}
      >
        <div className="mt-12 mb-10 flex flex-col items-center justify-center">
          <div className="flex items-center">
            <Logo hasTitle />
          </div>

          <div className="mt-4 text-center text-2xl font-light leading-tight text-gray-700">{title}</div>
        </div>

        <div
          className={clsx(
            appEnv.fullPage ? 'w-full mx-auto max-w-md rounded-md' : '-mx-4 border-t border-gray-200',
            'px-4',
            'bg-white',
            'shadow-md'
          )}
        >
          {children}
        </div>

        <div className={clsx('flex-1', !appEnv.fullPage && '-mx-4 px-4 bg-white')} />
      </div>
    </>
  );
};

export default SimplePageLayout;
