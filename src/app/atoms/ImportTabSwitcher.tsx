import React, { memo } from 'react';

import clsx from 'clsx';

import { TID, T } from 'lib/i18n';
import { Link } from 'lib/woozie';

interface ImportTabDescriptor {
  slug: string;
  i18nKey: TID;
}

interface Props {
  tabs: ImportTabDescriptor[];
  activeTabSlug: string;
  urlPrefix: string;
}

const ImportTabSwitcher = memo<Props>(({ tabs, activeTabSlug, urlPrefix }) => (
  <div className="w-full mb-8 border-b text-ulg">
    <div className="flex items-center justify-around">
      {tabs.map(({ slug, i18nKey }) => {
        const active = slug === activeTabSlug;

        return (
          <Link key={slug} to={`${urlPrefix}/${slug}`} replace>
            <div
              className={clsx(
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
));

export default ImportTabSwitcher;
