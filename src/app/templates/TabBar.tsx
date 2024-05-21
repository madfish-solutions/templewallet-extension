import React, { FC } from 'react';

import clsx from 'clsx';

import { TestIDProps } from 'lib/analytics';
import { Link } from 'lib/woozie';

interface Props {
  activeTabName: string;
  tabs: TabInterface[];
  withOutline?: boolean;
}

export interface TabInterface extends TestIDProps {
  name: string;
  title: JSX.Element;
}

export const TabsBar = React.forwardRef<HTMLDivElement, Props>(({ activeTabName, tabs, withOutline }, ref) => (
  <div ref={ref} className="w-full max-w-sm mx-auto flex items-center justify-center">
    {tabs.map(tab => (
      <TabButton key={tab.name} active={tab.name === activeTabName} withOutline={withOutline} {...tab} />
    ))}
  </div>
));

interface TabButtonProps extends TestIDProps {
  name: string;
  title: JSX.Element;
  active: boolean;
  withOutline?: boolean;
}

const TabButton: FC<TabButtonProps> = ({ name, title, active, withOutline, testID, testIDProperties }) => (
  <Link
    to={lctn => ({ ...lctn, search: `?tab=${name}` })}
    replace
    className={clsx(
      'flex1 w-full text-center cursor-pointer py-2 border-t-3',
      'text-gray-500 text-xs font-medium truncate',
      'transition ease-in-out duration-300',
      active
        ? 'border-primary-orange text-primary-orange'
        : clsx('hover:text-primary-orange', withOutline ? 'border-gray-100' : 'border-transparent')
    )}
    testID={testID}
    testIDProperties={testIDProperties}
  >
    {title}
  </Link>
);
