import React from 'react';

import classNames from 'clsx';

import { T } from 'lib/i18n/react';
import { Link } from 'lib/woozie';

export type TabDescriptor = {
  slug: string;
  i18nKey: string;
  isDotVisible?: boolean;
};

type TabSwitcherProps = {
  className?: string;
  tabs: TabDescriptor[];
  activeTabSlug: string;
  urlPrefix: string;
};

const TabSwitcher: React.FC<TabSwitcherProps> = ({ className, tabs, activeTabSlug, urlPrefix }) => (
  <div className={classNames('w-full', className)} style={{ borderBottomWidth: 1, fontSize: 17 }}>
    <div className={classNames('flex items-center justify-around')}>
      {tabs.map(({ slug, i18nKey, isDotVisible }) => {
        const active = slug === activeTabSlug;

        return (
          <Link key={slug} to={`${urlPrefix}/${slug}`} replace>
            <div
              className={classNames(
                'flex row items-center gap-1',
                'text-center cursor-pointer pb-1 pt-2 px-4',
                'text-gray-500',
                'border-b-2',
                active ? 'border-primary-orange' : 'border-transparent',
                active ? 'text-primary-orange' : 'hover:text-primary-orange',
                'transition ease-in-out duration-300',
                'truncate'
              )}
            >
              {isDotVisible && (
                <span
                  className="bg-red-600"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%'
                  }}
                />
              )}
              <T id={i18nKey} />
            </div>
          </Link>
        );
      })}
    </div>
  </div>
);

export default TabSwitcher;
