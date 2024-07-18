import React, { memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import { IconBase, ToggleSwitch } from 'app/atoms';
import { ReactComponent as DeleteIcon } from 'app/icons/base/delete.svg';
import { dispatch } from 'app/store';
import { setEvmTokenStatusAction } from 'app/store/evm/assets/actions';
import { useStoredEvmTokenSelector } from 'app/store/evm/assets/selectors';
import { setTezosTokenStatusAction } from 'app/store/tezos/assets/actions';
import { useStoredTezosTokenSelector } from 'app/store/tezos/assets/selectors';
import { EvmTokenIconWithNetwork, TezosTokenIconWithNetwork } from 'app/templates/AssetIcon';
import { DeleteAssetModal } from 'app/templates/remove-asset-modal/delete-asset-modal';
import { setAnotherSelector } from 'lib/analytics';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { getAssetStatus } from 'lib/assets/hooks/utils';
import { useEvmTokenBalance, useTezosAssetBalance } from 'lib/balances/hooks';
import { getTokenName, getAssetSymbol } from 'lib/metadata';
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
  manageActive?: boolean;
}

export const TezosListItem = memo<TezosListItemProps>(
  ({ network, publicKeyHash, assetSlug, active, scam, manageActive = false }) => {
    const {
      value: balance = ZERO,
      rawValue: rawBalance,
      assetMetadata: metadata
    } = useTezosAssetBalance(assetSlug, publicKeyHash, network);
    const { chainId } = network;

    const classNameMemo = useMemo(
      () =>
        clsx(
          'relative block w-full overflow-hidden flex items-center p-2 rounded-lg',
          'hover:bg-secondary-low transition ease-in-out duration-200 focus:outline-none group',
          active && 'focus:bg-secondary-low'
        ),
      [active]
    );

    const storedToken = useStoredTezosTokenSelector(publicKeyHash, chainId, assetSlug);

    const checked = getAssetStatus(rawBalance, storedToken?.status, assetSlug) === 'enabled';
    const isNativeToken = assetSlug === TEZ_TOKEN_SLUG;

    const [deleteModalOpened, setDeleteModalOpened, setDeleteModalClosed] = useBooleanState(false);

    const deleteItem = useCallback(
      () =>
        void dispatch(
          setTezosTokenStatusAction({
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
          setTezosTokenStatusAction({
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
    const assetName = getTokenName(metadata);

    return manageActive ? (
      <>
        <div
          className={clsx(
            'relative w-full overflow-hidden flex items-center p-2 rounded-lg',
            'hover:bg-secondary-low transition ease-in-out duration-200 focus:outline-none',
            'focus:bg-secondary-low'
          )}
        >
          <TezosTokenIconWithNetwork
            tezosChainId={network.chainId}
            assetSlug={assetSlug}
            className="mr-1 flex-shrink-0"
          />

          <div className={clsx('w-full', styles.tokenInfoWidth)}>
            <div className="flex items-center justify-between w-full">
              <div className="truncate max-w-36">
                <div className="text-font-medium mb-1">{assetSymbol}</div>
                <div className="flex text-font-description items-center text-grey-1 flex-1">{assetName}</div>
              </div>
              <div className="flex flex-row gap-x-2">
                <IconBase
                  Icon={DeleteIcon}
                  size={16}
                  className={isNativeToken ? 'text-disable' : 'cursor-pointer text-error'}
                  onClick={isNativeToken ? undefined : setDeleteModalOpened}
                />
                <ToggleSwitch
                  checked={isNativeToken ? true : checked}
                  disabled={isNativeToken}
                  onChange={toggleTokenStatus}
                />
              </div>
            </div>
          </div>
        </div>
        {deleteModalOpened && <DeleteAssetModal onClose={setDeleteModalClosed} onDelete={deleteItem} />}
      </>
    ) : (
      <Link
        to={toExploreAssetLink(TempleChainKind.Tezos, network.chainId, assetSlug)}
        className={classNameMemo}
        testID={AssetsSelectors.assetItemButton}
        testIDProperties={{ key: assetSlug }}
        {...setAnotherSelector('name', assetName)}
      >
        <TezosTokenIconWithNetwork
          tezosChainId={network.chainId}
          assetSlug={assetSlug}
          className="mr-1 flex-shrink-0"
        />

        <div className={clsx('w-full', styles.tokenInfoWidth)}>
          <div className="flex justify-between w-full mb-1">
            <div className="flex items-center flex-initial">
              <div className="text-font-medium truncate max-w-36">{assetSymbol}</div>
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
            <div className="flex text-font-description items-center text-grey-1 truncate max-w-36 flex-1">
              {assetName}
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
  }
);

const containerClassName = clsx(
  'relative w-full overflow-hidden flex items-center p-2 rounded-lg',
  'hover:bg-secondary-low transition ease-in-out duration-200 focus:outline-none',
  'focus:bg-secondary-low'
);

interface EvmListItemProps {
  chainId: number;
  publicKeyHash: HexString;
  assetSlug: string;
  manageActive?: boolean;
}

export const EvmListItem = memo<EvmListItemProps>(({ chainId, publicKeyHash, assetSlug, manageActive = false }) => {
  const {
    value: balance = ZERO,
    rawValue: rawBalance,
    metadata
  } = useEvmTokenBalance(assetSlug, publicKeyHash, chainId);
  const storedToken = useStoredEvmTokenSelector(publicKeyHash, chainId, assetSlug);

  const checked = getAssetStatus(rawBalance, storedToken?.status) === 'enabled';
  const isNativeToken = assetSlug === EVM_TOKEN_SLUG;

  const [deleteModalOpened, setDeleteModalOpened, setDeleteModalClosed] = useBooleanState(false);

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
  const assetName = getTokenName(metadata);

  return manageActive ? (
    <>
      <div className={containerClassName}>
        <EvmTokenIconWithNetwork evmChainId={chainId} assetSlug={assetSlug} className="mr-1 flex-shrink-0" />

        <div className={clsx('w-full', styles.tokenInfoWidth)}>
          <div className="flex items-center justify-between w-full">
            <div className="truncate max-w-36">
              <div className="text-font-medium mb-1">{assetSymbol}</div>
              <div className="flex text-font-description items-center text-grey-1 flex-1">{assetName}</div>
            </div>
            <div className="flex flex-row gap-x-2">
              <IconBase
                Icon={DeleteIcon}
                size={16}
                className={isNativeToken ? 'text-disable' : 'cursor-pointer text-error'}
                onClick={isNativeToken ? undefined : setDeleteModalOpened}
              />
              <ToggleSwitch
                checked={isNativeToken ? true : checked}
                disabled={isNativeToken}
                onChange={toggleTokenStatus}
              />
            </div>
          </div>
        </div>
      </div>
      {deleteModalOpened && <DeleteAssetModal onClose={setDeleteModalClosed} onDelete={deleteItem} />}
    </>
  ) : (
    <Link
      to={toExploreAssetLink(TempleChainKind.EVM, chainId, assetSlug)}
      className={containerClassName}
      testID={AssetsSelectors.assetItemButton}
      testIDProperties={{ key: assetSlug }}
      {...setAnotherSelector('name', assetName)}
    >
      <EvmTokenIconWithNetwork evmChainId={chainId} assetSlug={assetSlug} className="mr-1 flex-shrink-0" />

      <div className={clsx('w-full', styles.tokenInfoWidth)}>
        <div className="flex justify-between w-full mb-1">
          <div className="text-font-medium truncate max-w-36">{assetSymbol}</div>

          <CryptoBalance
            value={balance}
            testID={AssetsSelectors.assetItemCryptoBalanceButton}
            testIDProperties={{ assetSlug }}
          />
        </div>
        <div className="flex justify-between w-full">
          <div className="flex text-font-description items-center text-grey-1 truncate max-w-36 flex-1">
            {assetName}
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
