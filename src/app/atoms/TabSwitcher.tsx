import React from 'react';

import classNames from 'clsx';

import { TID, T } from 'lib/i18n';
import { Link } from 'lib/woozie';

import { ImportAccountSelectors } from '../pages/ImportAccount/ImportAccount.selectors';

type TabDescriptor = {
  slug: string;
  i18nKey: TID;
};

type TabSwitcherProps = {
  className?: string;
  tabs: TabDescriptor[];
  activeTabSlug: string;
  urlPrefix: string;
};

export const TabSwitcher: React.FC<TabSwitcherProps> = ({ className, tabs, activeTabSlug, urlPrefix }) => (
  <div className={classNames('w-full max-w-md mx-auto flex flex-wrap items-center justify-center', className)}>
    {tabs.map(({ slug, i18nKey }) => {
      const active = slug === activeTabSlug;

      return (
        <Link
          key={slug}
          to={`${urlPrefix}/${slug}`}
          replace
          className={classNames(
            'text-center cursor-pointer rounded-md mx-1 py-2 px-3 mb-1 text-gray-600 text-sm',
            active ? 'text-primary-orange bg-primary-orange bg-opacity-10' : 'hover:bg-gray-100 focus:bg-gray-100',
            'transition ease-in-out duration-200'
          )}
          testID={ImportAccountSelectors.tabSwitcher}
        >
          <T id={i18nKey} />
        </Link>
      );
    })}
  </div>
);
