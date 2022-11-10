import React, { memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import { useAssetMetadata } from 'lib/temple/front';
import { getAssetName, getAssetSymbol } from 'lib/temple/metadata';
import { Link } from 'lib/woozie';

import { AssetIcon } from '../../../../templates/AssetIcon';
import { AssetsSelectors } from '../../Assets.selectors';
import styles from '../Tokens.module.css';
import { toExploreAssetLink } from '../utils';
import { Balance } from './Balance';
import { DelegateButton } from './DelegateButton';

interface ListItemProps {
  active: boolean;
  assetSlug: string;
  latestBalances: Record<string, BigNumber>;
}

export const ListItem = memo<ListItemProps>(({ active, assetSlug, latestBalances }) => {
  const latestBalance = useMemo(() => {
    if (latestBalances.hasOwnProperty(assetSlug)) {
      return latestBalances[assetSlug];
    }

    return new BigNumber(0);
  }, [assetSlug, latestBalances]);

  const metadata = useAssetMetadata(assetSlug);

  if (metadata == null) return null;

  return (
    <Link
      to={toExploreAssetLink(assetSlug)}
      className={classNames(
        'relative',
        'block w-full',
        'overflow-hidden',
        active ? 'hover:bg-gray-200' : 'hover:bg-gray-200 focus:bg-gray-200',
        'flex items-center px-4 py-3',
        'text-gray-700',
        'transition ease-in-out duration-200',
        'focus:outline-none'
      )}
      testID={AssetsSelectors.AssetItemButton}
      testIDProperties={{ key: assetSlug }}
    >
      <AssetIcon assetSlug={assetSlug} size={40} className="mr-2 flex-shrink-0" />

      <div className={classNames('w-full', styles.tokenInfoWidth)}>
        <div className="flex justify-between w-full mb-1">
          <div className="flex items-center flex-initial">
            <div className={classNames(styles['tokenSymbol'])}>{getAssetSymbol(metadata)}</div>
            {assetSlug === 'tez' && <DelegateButton />}
          </div>
          <Balance assetSlug={assetSlug} value={latestBalance} />
        </div>
        <div className="flex justify-between w-full mb-1">
          <div className="text-xs font-normal text-gray-700 truncate flex-1">{getAssetName(metadata)}</div>
          <Balance assetSlug={assetSlug} value={latestBalance} inFiat />
        </div>
      </div>
    </Link>
  );
});
