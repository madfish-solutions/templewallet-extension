import React, { memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import { IconBase, ToggleSwitch } from 'app/atoms';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { ReactComponent as DeleteIcon } from 'app/icons/base/delete.svg';
import { dispatch } from 'app/store';
import { setEvmTokenStatusAction } from 'app/store/evm/assets/actions';
import { useStoredEvmTokenSelector } from 'app/store/evm/assets/selectors';
import { EvmTokenIconWithNetwork, TezosTokenIconWithNetwork } from 'app/templates/AssetIcon';
import { DeleteAssetModal } from 'app/templates/remove-asset-modal/delete-asset-modal';
import { setAnotherSelector } from 'lib/analytics';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { getAssetStatus } from 'lib/assets/hooks/utils';
import { useEvmTokenBalance, useTezosAssetBalance } from 'lib/balances/hooks';
import { getAssetName, getAssetSymbol } from 'lib/metadata';
import { useBooleanState } from 'lib/ui/hooks';
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
      clsx(
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

      <div className={clsx('w-full', styles.tokenInfoWidth)}>
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
  manageActive: boolean;
}

export const EvmListItem = memo<EvmListItemProps>(({ chainId, publicKeyHash, assetSlug, manageActive = false }) => {
  const { value: balance = ZERO, rawValue, metadata } = useEvmTokenBalance(assetSlug, publicKeyHash, chainId);
  const storedToken = useStoredEvmTokenSelector(publicKeyHash, chainId, assetSlug);

  const checked = getAssetStatus(rawValue, storedToken?.status) === 'enabled';
  const isNativeToken = assetSlug === EVM_TOKEN_SLUG;

  const [deleteModalOpened, setDeleteModalOpened, setDeleteModalClosed] = useBooleanState(false);

  const LinkOrDiv = useMemo(() => (manageActive ? 'div' : Link), [manageActive]);

  const deleteItem = useCallback(
    () =>
      void dispatch(
        setEvmTokenStatusAction({
          account: publicKeyHash,
          chainId,
          slug: assetSlug,
          status: 'removed'
        })
      ),
    [assetSlug, chainId, publicKeyHash]
  );

  const toggleTokenStatus = useCallback(
    () =>
      void dispatch(
        setEvmTokenStatusAction({
          account: publicKeyHash,
          chainId,
          slug: assetSlug,
          status: checked ? 'disabled' : 'enabled'
        })
      ),
    [checked, assetSlug, chainId, publicKeyHash]
  );

  if (metadata == null) return null;

  const assetSymbol = getAssetSymbol(metadata);
  const assetName = getAssetName(metadata);

  return (
    <>
      <LinkOrDiv
        to={toExploreAssetLink(TempleChainKind.EVM, chainId, assetSlug)}
        className={clsx(
          'relative w-full overflow-hidden flex items-center p-2 rounded-lg',
          'hover:bg-secondary-low transition ease-in-out duration-200 focus:outline-none',
          'focus:bg-secondary-low group'
        )}
        testID={AssetsSelectors.assetItemButton}
        testIDProperties={{ key: assetSlug }}
        {...setAnotherSelector('name', assetName)}
      >
        <EvmTokenIconWithNetwork evmChainId={chainId} assetSlug={assetSlug} className="mr-1 flex-shrink-0" />

        <div className={clsx('w-full', styles.tokenInfoWidth)}>
          {manageActive ? (
            <div className="flex items-center justify-between w-full">
              <div>
                <div className="text-font-medium mb-1">{assetSymbol}</div>
                <div className="flex text-font-description items-center text-grey-1 truncate flex-1">{assetName}</div>
              </div>
              <div className="flex flex-row gap-x-2">
                <IconBase
                  Icon={DeleteIcon}
                  size={16}
                  className={isNativeToken ? 'text-disable' : 'cursor-pointer text-primary'}
                  onClick={isNativeToken ? undefined : setDeleteModalOpened}
                />
                <ToggleSwitch
                  checked={isNativeToken ? true : checked}
                  disabled={assetSlug === EVM_TOKEN_SLUG}
                  onChange={toggleTokenStatus}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between w-full mb-1">
                <div className="flex items-center flex-initial">
                  <div className="text-font-medium">{assetSymbol}</div>
                </div>
                <CryptoBalance
                  value={balance}
                  testID={AssetsSelectors.assetItemCryptoBalanceButton}
                  testIDProperties={{ assetSlug }}
                />
              </div>
              <div className="flex justify-between w-full">
                <div className="flex text-font-description items-center text-grey-1 truncate flex-1">{assetName}</div>
                <FiatBalance
                  evm
                  chainId={chainId}
                  assetSlug={assetSlug}
                  value={balance}
                  testID={AssetsSelectors.assetItemFiatBalanceButton}
                  testIDProperties={{ assetSlug }}
                />
              </div>
            </>
          )}
        </div>
      </LinkOrDiv>
      {deleteModalOpened && <DeleteAssetModal onClose={setDeleteModalClosed} onDelete={deleteItem} />}
    </>
  );
});
