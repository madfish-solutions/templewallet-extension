import React, { memo } from 'react';

import clsx from 'clsx';

import { Anchor, IconBase } from 'app/atoms';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { CustomDAppInfo } from 'lib/apis/temple/endpoints/get-dapps-list';

import { DappsPageSelectors } from '../selectors';

import { DAppIcon } from './DappIcon';

type DAppItemProps = CustomDAppInfo;

export const FeaturedDappItem = memo<DAppItemProps>(({ dappUrl, name, logo }) => (
  <Anchor
    className={clsx(
      'flex flex-col w-28 h-23 relative group',
      'justify-center items-center rounded-8 shadow-bottom',
      'bg-white border-0.5 border-transparent hover:border-lines',
      'transition ease-in-out duration-200'
    )}
    href={dappUrl}
    rel="noreferrer"
    testID={DappsPageSelectors.DAppOpened}
    testIDProperties={{ dappUrl, name, featured: true }}
    treatAsButton={true}
  >
    <DAppIcon name={name} logo={logo} />
    <p className="text-font-medium mt-2 max-w-20 truncate">{name}</p>

    <IconBase
      Icon={OutLinkIcon}
      size={12}
      className="absolute top-1 right-1 text-secondary opacity-0 group-hover:opacity-100"
    />
  </Anchor>
));

export const DappItem = memo<DAppItemProps>(({ slug, dappUrl, name, logo, categories }) => (
  <Anchor
    className={clsx(
      'flex justify-between items-center p-3 group',
      'rounded-8 shadow-bottom border-0.5 border-transparent',
      'transition ease-in-out duration-200',
      'bg-white hover:border-lines'
    )}
    href={dappUrl}
    rel="noreferrer"
    testID={DappsPageSelectors.DAppOpened}
    testIDProperties={{ dappUrl, name, featured: false }}
    treatAsButton={true}
  >
    <div className="flex gap-x-2">
      <DAppIcon name={name} logo={logo} />
      <div className="flex flex-col gap-y-1">
        <p className="text-font-medium max-w-56 truncate">{name}</p>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <ItemTag key={`${slug}_${category}`} name={category} />
          ))}
        </div>
      </div>
    </div>

    <IconBase Icon={OutLinkIcon} className="text-secondary opacity-0 group-hover:opacity-100" />
  </Anchor>
));

const ItemTag = memo<{ name: string }>(({ name }) => (
  <div className="px-1 py-0.5 inline-flex items-center rounded bg-grey-4">
    <span className="text-font-small text-grey-1">{name}</span>
  </div>
));
