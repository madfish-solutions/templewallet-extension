import React, { memo, useMemo } from 'react';

import classNames from 'clsx';

import { TezosAssetIcon, EvmTokenIcon } from 'app/templates/AssetIcon';
import { setAnotherSelector } from 'lib/analytics';
import { useEvmTokenBalance, useTezosAssetBalance } from 'lib/balances/hooks';
import { getAssetName, getAssetSymbol } from 'lib/metadata';
import { ZERO } from 'lib/utils/numbers';
import { Link } from 'lib/woozie';
import { EvmNetworkEssentials, TezosNetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { AssetsSelectors } from '../../Assets.selectors';
import styles from '../Tokens.module.css';
import { toExploreAssetLink } from '../utils';

import { CryptoBalance, FiatBalance } from './Balance';
import { TokenTag } from './TokenTag';

interface TezosListItemProps {
  network: TezosNetworkEssentials;
  publicKeyHash: string;
  assetSlug: string;
  active: boolean;
  scam?: boolean;
}

export const TezosListItem = memo<TezosListItemProps>(({ network, publicKeyHash, assetSlug, active, scam }) => {
  const { value: balance = ZERO, assetMetadata: metadata } = useTezosAssetBalance(assetSlug, publicKeyHash, network);

  const classNameMemo = useMemo(
    () =>
      classNames(
        'relative block w-full overflow-hidden flex items-center px-4 py-3 rounded',
        'hover:bg-gray-200 text-gray-700 transition ease-in-out duration-200 focus:outline-none',
        active && 'focus:bg-gray-200'
      ),
    [active]
  );

  if (metadata == null) return null;

  const assetSymbol = getAssetSymbol(metadata);
  const assetName = getAssetName(metadata);

  return (
    <Link
      to={toExploreAssetLink(TempleChainKind.Tezos, network.chainId, assetSlug)}
      className={classNameMemo}
      testID={AssetsSelectors.assetItemButton}
      testIDProperties={{ key: assetSlug }}
      {...setAnotherSelector('name', assetName)}
    >
      <TezosAssetIcon tezosChainId={network.chainId} assetSlug={assetSlug} size={40} className="mr-2 flex-shrink-0" />

      <div className={classNames('w-full', styles.tokenInfoWidth)}>
        <div className="flex justify-between w-full mb-1">
          <div className="flex items-center flex-initial">
            <div className={styles['tokenSymbol']}>{assetSymbol}</div>
            <TokenTag
              network={network}
              tezPkh={publicKeyHash}
              assetSlug={assetSlug}
              assetSymbol={assetSymbol}
              scam={scam}
            />
          </div>
          <CryptoBalance
            value={balance}
            testID={AssetsSelectors.assetItemCryptoBalanceButton}
            testIDProperties={{ assetSlug }}
          />
        </div>
        <div className="flex justify-between w-full mb-1">
          <div className="text-xs font-normal text-gray-700 truncate flex-1">{assetName}</div>
          <FiatBalance
            chainId={network.chainId}
            assetSlug={assetSlug}
            value={balance}
            testID={AssetsSelectors.assetItemFiatBalanceButton}
            testIDProperties={{ assetSlug }}
          />
        </div>
      </div>
    </Link>
  );
});

interface EvmListItemProps {
  network: EvmNetworkEssentials;
  publicKeyHash: HexString;
  assetSlug: string;
}

export const EvmListItem = memo<EvmListItemProps>(({ network, publicKeyHash, assetSlug }) => {
  const { value: balance = ZERO, metadata } = useEvmTokenBalance(assetSlug, publicKeyHash, network.chainId);

  if (metadata == null) return null;

  const assetSymbol = getAssetSymbol(metadata);
  const assetName = getAssetName(metadata);

  return (
    <Link
      to={toExploreAssetLink(TempleChainKind.EVM, network.chainId, assetSlug)}
      className={classNames(
        'relative w-full overflow-hidden flex items-center px-4 py-3 rounded',
        'hover:bg-gray-200 text-gray-700 transition ease-in-out duration-200 focus:outline-none',
        'focus:bg-gray-200'
      )}
      testID={AssetsSelectors.assetItemButton}
      testIDProperties={{ key: assetSlug }}
      {...setAnotherSelector('name', assetName)}
    >
      <EvmTokenIcon evmChainId={network.chainId} assetSlug={assetSlug} size={40} className="mr-2 flex-shrink-0" />

      <div className={classNames('w-full', styles.tokenInfoWidth)}>
        <div className="flex justify-between w-full mb-1">
          <div className="flex items-center flex-initial">
            <div className={styles['tokenSymbol']}>{assetSymbol}</div>
          </div>
          <CryptoBalance
            value={balance}
            testID={AssetsSelectors.assetItemCryptoBalanceButton}
            testIDProperties={{ assetSlug }}
          />
        </div>
        <div className="flex justify-between w-full mb-1">
          <div className="text-xs font-normal text-gray-700 truncate flex-1">{assetName}</div>
          <FiatBalance
            evm
            chainId={network.chainId}
            assetSlug={assetSlug}
            value={balance}
            testID={AssetsSelectors.assetItemFiatBalanceButton}
            testIDProperties={{ assetSlug }}
          />
        </div>
      </div>
    </Link>
  );
});
