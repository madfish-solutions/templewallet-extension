import React, { memo } from 'react';

import clsx from 'clsx';

import { Anchor } from 'app/atoms';
import { CustomDAppInfo } from 'lib/apis/temple/endpoints/get-dapps-list';

import { DappsPageSelectors } from '../selectors';

import { DAppIcon } from './DappIcon';

type DAppItemProps = CustomDAppInfo;

export const FeaturedDappItem = memo<DAppItemProps>(({ dappUrl, name, logo }) => {
  return (
    <Anchor
      className={clsx(
        'flex flex-col w-28 h-23 relative',
        'justify-center items-center',
        'rounded-8 shadow-bottom',
        'transition ease-in-out duration-200',
        'bg-white hover:bg-gray-100'
      )}
      href={dappUrl}
      rel="noreferrer"
      testID={DappsPageSelectors.DAppOpened}
      testIDProperties={{ dappUrl, name, featured: true }}
      treatAsButton={true}
    >
      <DAppIcon name={name} logo={logo} />
      <p className="text-font-medium mt-2 max-w-20 truncate">{name}</p>
    </Anchor>
  );
});

export const DappItem = memo<DAppItemProps>(({ slug, dappUrl, name, logo, categories }) => {
  return (
    <Anchor
      className={clsx(
        'flex p-3 gap-x-2 relative',
        'justify-start items-center',
        'rounded-8 shadow-bottom',
        'transition ease-in-out duration-200',
        'bg-white hover:bg-gray-100'
      )}
      href={dappUrl}
      rel="noreferrer"
      testID={DappsPageSelectors.DAppOpened}
      testIDProperties={{ dappUrl, name, featured: false }}
      treatAsButton={true}
    >
      <DAppIcon name={name} logo={logo} />
      <div className="flex flex-col gap-y-1">
        <p className="text-font-medium max-w-52 truncate">{name}</p>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <ItemTag key={`${slug}_${category}`} name={category} />
          ))}
        </div>
      </div>
    </Anchor>
  );
});

const ItemTag = memo<{ name: string }>(({ name }) => (
  <div className="px-1 py-0.5 inline-flex items-center rounded bg-grey-4">
    <span className="text-font-small text-grey-1">{name}</span>
  </div>
));
