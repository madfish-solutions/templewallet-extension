import React from 'react';

import classNames from 'clsx';

import { TID, T } from 'lib/i18n/react';
import { Link } from 'lib/woozie';

export interface TabDescriptor {
  slug: string;
  i18nKey: TID;
}

interface TabSwitcherProps {
  className?: string;
  tabs: TabDescriptor[];
  activeTabSlug: string;
  urlPrefix: string;
  isImportPage?: boolean;
}

export const TabSwitcher: React.FC<TabSwitcherProps> = ({ className, tabs, activeTabSlug, urlPrefix }) => (
  <div className={classNames('w-full max-w-md mx-auto', 'flex flex-wrap items-center justify-center', className)}>
    {tabs.map(({ slug, i18nKey }) => {
      const active = slug === activeTabSlug;

        return (
          <Link
            key={slug}
            to={`${urlPrefix}/${slug}`}
            replace
            className={classNames(
              'flex row items-center gap-1',
              'text-center cursor-pointer pb-1 pt-2',
              isImportPage ? 'px-4' : 'flex-1 justify-center',
              'text-gray-500',
              'border-b-2',
              active ? 'border-primary-orange' : 'border-transparent',
              active ? 'text-primary-orange' : 'hover:text-primary-orange',
              'transition ease-in-out duration-300',
              'truncate'
            )}
          >
            <T id={i18nKey} />
          </Link>
        );
      })}
    </div>
  </div>
);
