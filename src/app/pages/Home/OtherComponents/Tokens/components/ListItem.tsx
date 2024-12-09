import React, { memo, MouseEventHandler, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import { IconBase, ToggleSwitch } from 'app/atoms';
import { ReactComponent as DeleteIcon } from 'app/icons/base/delete.svg';
import { dispatch } from 'app/store';
import { setEvmTokenStatusAction } from 'app/store/evm/assets/actions';
import { useStoredEvmTokenSelector } from 'app/store/evm/assets/selectors';
import { setTezosTokenStatusAction } from 'app/store/tezos/assets/actions';
import { useStoredTezosTokenSelector } from 'app/store/tezos/assets/selectors';
import { EvmAssetIconWithNetwork, TezosTokenIconWithNetwork } from 'app/templates/AssetIcon';
import { DeleteAssetModal } from 'app/templates/remove-asset-modal/delete-asset-modal';
import { setAnotherSelector } from 'lib/analytics';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { getAssetStatus } from 'lib/assets/hooks/utils';
import { useEvmTokenBalance, useTezosAssetBalance } from 'lib/balances/hooks';
import { getTokenName, getAssetSymbol } from 'lib/metadata';
import { useBooleanState } from 'lib/ui/hooks';
import { ZERO } from 'lib/utils/numbers';
import { Link } from 'lib/woozie';
import { EvmNetworkEssentials, TezosNetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { AssetsSelectors } from '../../Assets.selectors';
import { toExploreAssetLink } from '../utils';

import { CryptoBalance, FiatBalance } from './Balance';
import { TokenTag } from './TokenTag';

const LIST_ITEM_CLASSNAME = clsx(
  'flex items-center gap-x-1 p-2 rounded-lg',
  'hover:bg-secondary-low transition ease-in-out duration-200 focus:outline-none'
);

interface TezosListItemProps {
  network: TezosNetworkEssentials;
  publicKeyHash: string;
  assetSlug: string;
  active?: boolean;
  scam?: boolean;
  manageActive?: boolean;
  showTags?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement | HTMLAnchorElement>;
}

export const TezosListItem = memo<TezosListItemProps>(
  ({ network, publicKeyHash, assetSlug, active, scam, manageActive = false, showTags = true, onClick }) => {
    const {
      value: balance = ZERO,
      rawValue: rawBalance,
      assetMetadata: metadata
    } = useTezosAssetBalance(assetSlug, publicKeyHash, network);
    const { chainId } = network;

    const classNameMemo = useMemo(() => clsx(LIST_ITEM_CLASSNAME, active && 'focus:bg-secondary-low'), [active]);

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

    if (manageActive)
      return (
        <>
          <div className={LIST_ITEM_CLASSNAME} onClick={onClick}>
            <TezosTokenIconWithNetwork tezosChainId={network.chainId} assetSlug={assetSlug} className="shrink-0" />

            <div className="flex-grow flex gap-x-2 items-center overflow-hidden">
              <div className="flex-grow flex flex-col gap-y-1 overflow-hidden">
                <div className="text-font-medium truncate">{assetSymbol}</div>

                <div className="text-font-description items-center text-grey-1 truncate">{assetName}</div>
              </div>

              <IconBase
                Icon={DeleteIcon}
                size={16}
                className={clsx('shrink-0', isNativeToken ? 'text-disable' : 'cursor-pointer text-error')}
                onClick={isNativeToken ? undefined : setDeleteModalOpened}
              />

              <ToggleSwitch
                checked={isNativeToken ? true : checked}
                disabled={isNativeToken}
                onChange={toggleTokenStatus}
              />
            </div>
          </div>

          {deleteModalOpened && <DeleteAssetModal onClose={setDeleteModalClosed} onDelete={deleteItem} />}
        </>
      );

    return (
      <Link
        to={toExploreAssetLink(false, TempleChainKind.Tezos, network.chainId, assetSlug)}
        className={classNameMemo}
        onClick={onClick}
        testID={AssetsSelectors.assetItemButton}
        testIDProperties={{ key: assetSlug }}
        {...setAnotherSelector('name', assetName)}
      >
        <TezosTokenIconWithNetwork tezosChainId={network.chainId} assetSlug={assetSlug} className="shrink-0" />

        <div className="flex-grow flex flex-col gap-y-1 overflow-hidden">
          <div className="flex gap-x-4">
            <div className="flex items-center flex-grow gap-x-2 truncate">
              <div className="text-font-medium truncate">{assetSymbol}</div>

              {showTags && (
                <TokenTag
                  network={network}
                  tezPkh={publicKeyHash}
                  assetSlug={assetSlug}
                  assetSymbol={assetSymbol}
                  scam={scam}
                />
              )}
            </div>

            <CryptoBalance
              value={balance}
              testID={AssetsSelectors.assetItemCryptoBalanceButton}
              testIDProperties={{ assetSlug }}
            />
          </div>

          <div className="flex gap-x-4">
            <div className="self-center flex-grow text-font-description text-grey-1 truncate">{assetName}</div>

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

interface EvmListItemProps {
  network: EvmNetworkEssentials;
  publicKeyHash: HexString;
  assetSlug: string;
  manageActive?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement | HTMLAnchorElement>;
}

export const EvmListItem = memo<EvmListItemProps>(
  ({ network, publicKeyHash, assetSlug, manageActive = false, onClick }) => {
    const { chainId } = network;

    const {
      value: balance = ZERO,
      rawValue: rawBalance,
      metadata
    } = useEvmTokenBalance(assetSlug, publicKeyHash, network);
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

    const classNameMemo = useMemo(() => clsx(LIST_ITEM_CLASSNAME, 'focus:bg-secondary-low'), []);

    if (metadata == null) return null;

    const assetSymbol = getAssetSymbol(metadata);
    const assetName = getTokenName(metadata);

    if (manageActive)
      return (
        <>
          <div className={classNameMemo} onClick={onClick}>
            <EvmAssetIconWithNetwork evmChainId={chainId} assetSlug={assetSlug} className="shrink-0" />

            <div className="flex-grow flex gap-x-2 items-center overflow-hidden">
              <div className="flex-grow flex flex-col gap-y-1 overflow-hidden">
                <div className="text-font-medium truncate">{assetSymbol}</div>

                <div className="text-font-description items-center text-grey-1 truncate">{assetName}</div>
              </div>

              <IconBase
                Icon={DeleteIcon}
                size={16}
                className={clsx('shrink-0', isNativeToken ? 'text-disable' : 'cursor-pointer text-error')}
                onClick={isNativeToken ? undefined : setDeleteModalOpened}
              />

              <ToggleSwitch
                checked={isNativeToken ? true : checked}
                disabled={isNativeToken}
                onChange={toggleTokenStatus}
              />
            </div>
          </div>

          {deleteModalOpened && <DeleteAssetModal onClose={setDeleteModalClosed} onDelete={deleteItem} />}
        </>
      );

    return (
      <Link
        to={toExploreAssetLink(false, TempleChainKind.EVM, chainId, assetSlug)}
        className={classNameMemo}
        onClick={onClick}
        testID={AssetsSelectors.assetItemButton}
        testIDProperties={{ key: assetSlug }}
        {...setAnotherSelector('name', assetName)}
      >
        <EvmAssetIconWithNetwork evmChainId={chainId} assetSlug={assetSlug} className="shrink-0" />

        <div className="flex-grow flex flex-col gap-y-1 overflow-hidden">
          <div className="flex gap-x-4">
            <div className="flex-grow text-font-medium truncate">{assetSymbol}</div>

            <CryptoBalance
              value={balance}
              testID={AssetsSelectors.assetItemCryptoBalanceButton}
              testIDProperties={{ assetSlug }}
            />
          </div>

          <div className="flex gap-x-4">
            <div className="self-center flex-grow text-font-description text-grey-1 truncate">{assetName}</div>

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
  }
);
