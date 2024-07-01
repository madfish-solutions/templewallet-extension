import React, { FC, ReactNode } from 'react';

import clsx from 'clsx';

import DocBg from 'app/a11y/DocBg';
import { Logo } from 'app/atoms/Logo';
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
            <Logo type="icon-title" className="my-1.5" />
          </div>

          <div className="mt-4 text-center text-2xl font-light leading-tight text-gray-700">{title}</div>
        </div>

        <div
          className={clsx(
            'px-4 bg-white shadow-md',
            appEnv.fullPage ? 'rounded-md' : 'flex-1 border-t border-gray-200'
          )}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default SimplePageLayout;
