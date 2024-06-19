import React, { memo, useMemo } from 'react';

import classNames from 'clsx';

import { IconBase } from 'app/atoms';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { EvmTokenIconWithNetwork, TezosTokenIconWithNetwork } from 'app/templates/AssetIcon';
import { setAnotherSelector } from 'lib/analytics';
import { useEvmTokenBalance, useTezosAssetBalance } from 'lib/balances/hooks';
import { getAssetName, getAssetSymbol } from 'lib/metadata';
import { ZERO } from 'lib/utils/numbers';
import { Link } from 'lib/woozie';
import { TezosNetworkEssentials } from 'temple/networks';
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
  active?: boolean;
  scam?: boolean;
}

export const TezosListItem = memo<TezosListItemProps>(({ network, publicKeyHash, assetSlug, active, scam }) => {
  const { value: balance = ZERO, assetMetadata: metadata } = useTezosAssetBalance(assetSlug, publicKeyHash, network);

  const classNameMemo = useMemo(
    () =>
      classNames(
        'relative block w-full overflow-hidden flex items-center p-2 rounded-lg',
        'hover:bg-secondary-low transition ease-in-out duration-200 focus:outline-none group',
        active && 'focus:bg-secondary-low'
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
      <TezosTokenIconWithNetwork tezosChainId={network.chainId} assetSlug={assetSlug} className="mr-1 flex-shrink-0" />

      <div className={classNames('w-full', styles.tokenInfoWidth)}>
        <div className="flex justify-between w-full mb-1">
          <div className="flex items-center flex-initial">
            <div className="text-font-medium">{assetName}</div>
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
        <div className="flex justify-between w-full">
          <div
            className="flex items-center flex-initial"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              window.navigator.clipboard.writeText(assetSymbol);
            }}
          >
            <div className="flex text-font-description items-center text-grey-1 truncate flex-1">{assetSymbol}</div>
            <IconBase Icon={CopyIcon} size={10} className="ml-0.5 text-secondary opacity-0 group-hover:opacity-100" />
          </div>
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
  chainId: number;
  publicKeyHash: HexString;
  assetSlug: string;
}

export const EvmListItem = memo<EvmListItemProps>(({ chainId, publicKeyHash, assetSlug }) => {
  const { value: balance = ZERO, metadata } = useEvmTokenBalance(assetSlug, publicKeyHash, chainId);

  if (metadata == null) return null;

  const assetSymbol = getAssetSymbol(metadata);
  const assetName = getAssetName(metadata);

  return (
    <Link
      to={toExploreAssetLink(TempleChainKind.EVM, chainId, assetSlug)}
      className={classNames(
        'relative w-full overflow-hidden flex items-center p-2 rounded-lg',
        'hover:bg-secondary-low transition ease-in-out duration-200 focus:outline-none',
        'focus:bg-secondary-low group'
      )}
      testID={AssetsSelectors.assetItemButton}
      testIDProperties={{ key: assetSlug }}
      {...setAnotherSelector('name', assetName)}
    >
      <EvmTokenIconWithNetwork evmChainId={chainId} assetSlug={assetSlug} className="mr-1 flex-shrink-0" />

      <div className={classNames('w-full', styles.tokenInfoWidth)}>
        <div className="flex justify-between w-full mb-1">
          <div className="flex items-center flex-initial">
            <div className="text-font-medium">{assetName}</div>
          </div>
          <CryptoBalance
            value={balance}
            testID={AssetsSelectors.assetItemCryptoBalanceButton}
            testIDProperties={{ assetSlug }}
          />
        </div>
        <div className="flex justify-between w-full">
          <div
            className="flex items-center flex-initial"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              window.navigator.clipboard.writeText(assetSymbol);
            }}
          >
            <div className="flex text-font-description items-center text-grey-1 truncate flex-1">{assetSymbol}</div>
            <IconBase Icon={CopyIcon} size={10} className="ml-0.5 text-secondary opacity-0 group-hover:opacity-100" />
          </div>
          <FiatBalance
            evm
            chainId={chainId}
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
