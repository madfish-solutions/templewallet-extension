import React, { memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import { TokenApyInfo } from 'app/store/d-apps';
import { AssetIcon } from 'app/templates/AssetIcon';
import { useAssetMetadata } from 'lib/temple/front';
import { getAssetName, getAssetSymbol } from 'lib/temple/metadata';
import { Link } from 'lib/woozie';

import { AssetsSelectors } from '../../Assets.selectors';
import styles from '../Tokens.module.css';
import { toExploreAssetLink } from '../utils';
import { Balance } from './Balance';
import { TokenTag } from './TokenTag';

interface Props {
  active: boolean;
  assetSlug: string;
  balances: Record<string, BigNumber>;
  apyInfo?: TokenApyInfo;
}

export const ListItem = memo<Props>(({ active, assetSlug, balances, apyInfo }) => {
  const latestBalance = useMemo(() => {
    if (balances.hasOwnProperty(assetSlug)) {
      return balances[assetSlug];
    }

    return new BigNumber(0);
  }, [assetSlug, balances]);

  const metadata = useAssetMetadata(assetSlug);

  if (metadata == null) return null;

  const assetSymbol = getAssetSymbol(metadata);
  const assetName = getAssetName(metadata);

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
      trackID={AssetsSelectors.AssetItemButton}
      trackProperties={{ key: assetSlug }}
    >
      <AssetIcon assetSlug={assetSlug} size={40} className="mr-2 flex-shrink-0" />

      <div className={classNames('w-full', styles.tokenInfoWidth)}>
        <div className="flex justify-between w-full mb-1">
          <div className="flex items-center flex-initial">
            <div className={styles['tokenSymbol']}>{assetSymbol}</div>
            <TokenTag assetSlug={assetSlug} assetSymbol={assetSymbol} apyInfo={apyInfo} />
          </div>
          <Balance assetSlug={assetSlug} value={latestBalance} />
        </div>
        <div className="flex justify-between w-full mb-1">
          <div className="text-xs font-normal text-gray-700 truncate flex-1">{assetName}</div>
          <Balance assetSlug={assetSlug} value={latestBalance} inFiat />
        </div>
      </div>
    </Link>
  );
});
