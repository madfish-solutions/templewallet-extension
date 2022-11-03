import React, { memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import { AssetIcon } from 'app/templates/AssetIcon';
import { toFloatBalance } from 'lib/temple/assets';
import { useAssetMetadata } from 'lib/temple/front';
import { getAssetName, getAssetSymbol } from 'lib/temple/metadata';
import { Link } from 'lib/woozie';

import { AssetsSelectors } from '../../Assets.selectors';
import styles from '../Tokens.module.css';
import { toExploreAssetLink } from '../utils';
import Balance from './Balance';
import { DelegateButton } from './DelegateButton';

interface ListItemProps {
  active: boolean;
  assetSlug: string;
  rawBalances: Record<string, BigNumber>;
}

export const ListItem = memo<ListItemProps>(({ active, assetSlug, rawBalances }) => {
  const metadata = useAssetMetadata(assetSlug);

  const balance = useMemo(() => {
    const rawBalance: BigNumber | undefined = rawBalances[assetSlug];
    if (rawBalance && metadata) return toFloatBalance(rawBalance, metadata);
    return new BigNumber(0);
  }, [rawBalances, assetSlug, metadata]);

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
          <Balance assetSlug={assetSlug} balance={balance} />
        </div>
        <div className="flex justify-between w-full mb-1">
          <div className={classNames('text-xs font-normal text-gray-700 truncate flex-1')}>
            {getAssetName(metadata)}
          </div>
          <Balance assetSlug={assetSlug} balance={balance} inFiat />
        </div>
      </div>
    </Link>
  );
});
