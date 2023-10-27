import React from 'react';

import classNames from 'clsx';

import { TID, T } from 'lib/i18n';
import { Link } from 'lib/woozie';

type ImportTabDescriptor = {
  slug: string;
  i18nKey: TID;
};

type ImportTabSwitcherProps = {
  className?: string;
  tabs: ImportTabDescriptor[];
  activeTabSlug: string;
  urlPrefix: string;
};

const ImportTabSwitcher: React.FC<ImportTabSwitcherProps> = ({ className, tabs, activeTabSlug, urlPrefix }) => (
  <div className={classNames('w-full', className)} style={{ borderBottomWidth: 1, fontSize: 17 }}>
    <div className={classNames('flex items-center justify-between px-25')}>
      {tabs.map(({ slug, i18nKey }) => {
        const active = slug === activeTabSlug;

        return (
          <Link key={slug} to={`${urlPrefix}/${slug}`} replace>
            <div
              className={classNames(
                'text-center cursor-pointer pb-1 pt-2 px-4 border-b-2',
                'text-gray-500 truncate',
                'transition ease-in-out duration-300',
                active ? 'border-primary-orange text-primary-orange' : 'border-transparent hover:text-primary-orange'
              )}
            >
              <T id={i18nKey} />
            </div>
          </Link>
        );
      })}
    </div>
  </div>
);

export default ImportTabSwitcher;
