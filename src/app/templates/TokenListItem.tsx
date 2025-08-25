import React, { FC, ForwardedRef, forwardRef, memo, MouseEventHandler, useCallback } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { IconBase, ToggleSwitch } from 'app/atoms';
import { useIsItemVisible } from 'app/atoms/visibility-tracking-infinite-scroll';
import { ReactComponent as DeleteIcon } from 'app/icons/base/delete.svg';
import { ReactComponent as StarIcon } from 'app/icons/star.svg';
import { ReactComponent as StarFillIcon } from 'app/icons/starfill.svg';
import { ScamTag } from 'app/pages/Home/OtherComponents/Tokens/components/TokenTag/ScamTag';
import { dispatch } from 'app/store';
import { setEvmTokenStatusAction } from 'app/store/evm/assets/actions';
import { useStoredEvmTokenSelector } from 'app/store/evm/assets/selectors';
import { useLifiEvmTokenMetadataSelector } from 'app/store/evm/swap-lifi-metadata/selectors';
import { setTezosTokenStatusAction } from 'app/store/tezos/assets/actions';
import { useStoredTezosTokenSelector } from 'app/store/tezos/assets/selectors';
import { EvmAssetIconWithNetwork, TezosAssetIconWithNetwork } from 'app/templates/AssetIcon';
import { DeleteAssetModal } from 'app/templates/remove-asset-modal/delete-asset-modal';
import { setAnotherSelector } from 'lib/analytics';
import { TEMPLE_TOKEN_SLUG } from 'lib/assets';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { getAssetStatus } from 'lib/assets/hooks/utils';
import { toChainAssetSlug } from 'lib/assets/utils';
import { useEvmTokenBalance, useTezosAssetBalance } from 'lib/balances/hooks';
import { ASSET_HUGE_AMOUNT } from 'lib/constants';
import { getTokenName, getAssetSymbol } from 'lib/metadata';
import { useBooleanState } from 'lib/ui/hooks';
import { TokenListItemElement } from 'lib/ui/tokens-list';
import { ZERO } from 'lib/utils/numbers';
import { Link } from 'lib/woozie';
import { ChainId, PublicKeyHash } from 'temple/front/chains';
import { useFavoriteTokens } from 'temple/front/use-favorite-tokens';
import { EvmNetworkEssentials, NetworkEssentials, TezosNetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { AssetsSelectors } from '../pages/Home/OtherComponents/Assets.selectors';
import { CryptoBalance, FiatBalance } from '../pages/Home/OtherComponents/Tokens/components/Balance';
import { TokenTag } from '../pages/Home/OtherComponents/Tokens/components/TokenTag';
import { toExploreAssetLink } from '../pages/Home/OtherComponents/Tokens/utils';

const LIST_ITEM_CLASSNAME = clsx(
  'flex items-center gap-x-1 p-2 rounded-lg',
  'transition ease-in-out duration-200 focus:outline-none'
);

interface TezosTokenListItemProps {
  network: TezosNetworkEssentials;
  index?: number;
  publicKeyHash: string;
  assetSlug: string;
  active?: boolean;
  scam?: boolean;
  manageActive?: boolean;
  showTags?: boolean;
  showFavoritesMark?: boolean;
  showOnlyFavorites?: boolean;
  requiresVisibility?: boolean;
  onClick?: MouseEventHandler<TokenListItemElement>;
}

export const TezosTokenListItem = memo(
  forwardRef<TokenListItemElement, TezosTokenListItemProps>(
    (
      {
        network,
        index,
        publicKeyHash,
        assetSlug,
        active,
        scam,
        manageActive = false,
        requiresVisibility = true,
        showTags = true,
        showFavoritesMark = false,
        showOnlyFavorites = false,
        onClick
      },
      ref
    ) => {
      const {
        value: balance = ZERO,
        rawValue: rawBalance,
        assetMetadata: metadata
      } = useTezosAssetBalance(assetSlug, publicKeyHash, network);
      const { chainId } = network;

      const storedToken = useStoredTezosTokenSelector(publicKeyHash, chainId, assetSlug);

      const checked = getAssetStatus(rawBalance, storedToken?.status, assetSlug) === 'enabled';

      const assetSymbol = getAssetSymbol(metadata);
      const assetName = getTokenName(metadata);

      if (manageActive)
        return (
          <ManageTezosActiveListItemLayout
            assetSlug={assetSlug}
            assetSymbol={assetSymbol}
            assetName={assetName}
            className={clsx('focus:bg-secondary-low', scam ? 'hover:bg-error-low' : 'hover:bg-secondary-low')}
            scam={scam}
            checked={checked}
            network={network}
            index={index}
            publicKeyHash={publicKeyHash}
            onClick={onClick}
            ref={ref}
          />
        );

      return (
        <DefaultTezosListItemLayout
          assetSlug={assetSlug}
          assetName={assetName}
          className={clsx(active && 'focus:bg-secondary-low', scam ? 'hover:bg-error-low' : 'hover:bg-secondary-low')}
          network={network}
          showFavoritesMark={showFavoritesMark}
          showOnlyFavorites={showOnlyFavorites}
          index={index}
          balance={balance}
          onClick={onClick}
          requiresVisibility={requiresVisibility}
          ref={ref}
        >
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
        </DefaultTezosListItemLayout>
      );
    }
  )
);

interface EvmTokenListItemProps {
  network: EvmNetworkEssentials;
  index?: number;
  publicKeyHash: HexString;
  assetSlug: string;
  manageActive?: boolean;
  showFavoritesMark?: boolean;
  showOnlyFavorites?: boolean;
  onClick?: MouseEventHandler<TokenListItemElement>;
  requiresVisibility?: boolean;
}

export const EvmTokenListItem = memo(
  forwardRef<TokenListItemElement, EvmTokenListItemProps>(
    (
      {
        network,
        index,
        publicKeyHash,
        assetSlug,
        manageActive = false,
        requiresVisibility = true,
        showFavoritesMark = false,
        showOnlyFavorites = false,
        onClick
      },
      ref
    ) => {
      const { chainId } = network;
      const lifiTokenMetadata = useLifiEvmTokenMetadataSelector(chainId, assetSlug);

      const {
        value: balance = ZERO,
        rawValue: rawBalance,
        metadata
      } = useEvmTokenBalance(assetSlug, publicKeyHash, network);
      const storedToken = useStoredEvmTokenSelector(publicKeyHash, chainId, assetSlug);

      const checked = getAssetStatus(rawBalance, storedToken?.status) === 'enabled';

      if (metadata == null && lifiTokenMetadata == null) return null;

      const assetSymbol = getAssetSymbol(metadata?.decimals ? metadata : lifiTokenMetadata);
      const assetName = getTokenName(metadata?.decimals ? metadata : lifiTokenMetadata);

      if (manageActive)
        return (
          <ManageEvmActiveListItemLayout
            assetSlug={assetSlug}
            assetSymbol={assetSymbol}
            assetName={assetName}
            className="focus:bg-secondary-low, hover:bg-secondary-low"
            checked={checked}
            network={network}
            index={index}
            publicKeyHash={publicKeyHash}
            onClick={onClick}
            ref={ref}
          />
        );

      return (
        <DefaultEvmListItemLayout
          assetSlug={assetSlug}
          assetName={assetName}
          className="focus:bg-secondary-low, hover:bg-secondary-low"
          network={network}
          showFavoritesMark={showFavoritesMark}
          showOnlyFavorites={showOnlyFavorites}
          index={index}
          balance={balance}
          onClick={onClick}
          requiresVisibility={requiresVisibility}
          ref={ref}
        >
          <div className={clsx('flex-grow text-font-medium', balance.lt(ASSET_HUGE_AMOUNT) && 'truncate')}>
            {assetSymbol}
          </div>
        </DefaultEvmListItemLayout>
      );
    }
  )
);

interface ManageActiveListItemLayoutProps<T extends TempleChainKind> {
  assetSlug: string;
  assetSymbol: string;
  assetName: string;
  className?: string;
  scam?: boolean;
  checked: boolean;
  network: NetworkEssentials<T>;
  index?: number;
  publicKeyHash: PublicKeyHash<T>;
  onClick?: MouseEventHandler<TokenListItemElement>;
}

const UNMANAGABLE_TOKENS_SLUGS = {
  [TempleChainKind.Tezos]: [TEZ_TOKEN_SLUG, TEMPLE_TOKEN_SLUG],
  [TempleChainKind.EVM]: EVM_TOKEN_SLUG
};

const ManageActiveListItemLayoutHOC = <T extends TempleChainKind>(
  networkKind: T,
  AssetIconWithNetwork: FC<{ chainId: ChainId<T>; assetSlug: string; className?: string }>,
  toggleTokenStatus: (
    newStatus: 'enabled' | 'disabled',
    assetSlug: string,
    chainId: ChainId<T>,
    publicKeyHash: PublicKeyHash<T>
  ) => void,
  deleteItem: (assetSlug: string, chainId: ChainId<T>, publicKeyHash: PublicKeyHash<T>) => void
) =>
  memo(
    forwardRef<TokenListItemElement, ManageActiveListItemLayoutProps<T>>(
      (
        { assetSlug, assetSymbol, assetName, className, scam, checked, network, index, publicKeyHash, onClick },
        ref
      ) => {
        const { chainId } = network;
        const [deleteModalOpened, setDeleteModalOpened, setDeleteModalClosed] = useBooleanState(false);
        const isUnmanageable = UNMANAGABLE_TOKENS_SLUGS[networkKind].includes(assetSlug);
        const isVisible = useIsItemVisible(index);

        const handleTokenStatusSwitch = useCallback(
          () => toggleTokenStatus(checked ? 'disabled' : 'enabled', assetSlug, chainId, publicKeyHash),
          [assetSlug, checked, chainId, publicKeyHash]
        );

        const handleDeleteClick = useCallback(
          () => deleteItem(assetSlug, chainId, publicKeyHash),
          [assetSlug, chainId, publicKeyHash]
        );

        return (
          <>
            <div
              className={clsx(LIST_ITEM_CLASSNAME, className)}
              onClick={onClick}
              ref={ref as ForwardedRef<HTMLDivElement>}
            >
              {isVisible ? (
                <>
                  <AssetIconWithNetwork chainId={chainId} assetSlug={assetSlug} className="shrink-0" />

                  <div className="flex-grow flex gap-x-2 items-center overflow-hidden">
                    <div className="flex-grow flex flex-col gap-y-1 overflow-hidden">
                      <div className="flex items-center gap-0.5">
                        <div className="text-font-medium truncate">{assetSymbol}</div>
                        {scam && <ScamTag />}
                      </div>

                      <div className="text-font-description items-center text-grey-1 truncate">{assetName}</div>
                    </div>

                    <IconBase
                      Icon={DeleteIcon}
                      className={clsx('shrink-0', isUnmanageable ? 'text-disable' : 'cursor-pointer text-error')}
                      onClick={isUnmanageable ? undefined : setDeleteModalOpened}
                    />

                    <ToggleSwitch
                      checked={isUnmanageable ? true : checked}
                      disabled={isUnmanageable}
                      onChange={handleTokenStatusSwitch}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center relative shrink-0" style={{ width: 40, height: 40 }}>
                    <div className="rounded-full bg-grey-3" style={{ width: 30, height: 30 }} />
                    <div
                      className="absolute bottom-0 right-0 rounded-full bg-grey-3"
                      style={{ width: 16, height: 16 }}
                    />
                  </div>

                  <div className="flex-grow flex gap-x-2 items-center overflow-hidden">
                    <div className="flex-grow flex flex-col gap-y-1 overflow-hidden">
                      <div className="w-10 h-5 bg-grey-3 rounded" />
                      <div className="w-20 h-4 bg-grey-3 rounded" />
                    </div>

                    <div className="size-6 bg-grey-3 rounded" />
                    <div className="w-12 h-6 bg-grey-3 rounded" />
                  </div>
                </>
              )}
            </div>

            {deleteModalOpened && <DeleteAssetModal onClose={setDeleteModalClosed} onDelete={handleDeleteClick} />}
          </>
        );
      }
    )
  );
const ManageTezosActiveListItemLayout = ManageActiveListItemLayoutHOC<TempleChainKind.Tezos>(
  TempleChainKind.Tezos,
  ({ chainId, ...restProps }) => <TezosAssetIconWithNetwork tezosChainId={chainId} {...restProps} />,
  (status, slug, chainId, account) => void dispatch(setTezosTokenStatusAction({ account, chainId, slug, status })),
  (slug, chainId, account) => void dispatch(setTezosTokenStatusAction({ account, chainId, slug, status: 'removed' }))
);
const ManageEvmActiveListItemLayout = ManageActiveListItemLayoutHOC<TempleChainKind.EVM>(
  TempleChainKind.EVM,
  ({ chainId, ...restProps }) => <EvmAssetIconWithNetwork evmChainId={chainId} {...restProps} />,
  (status, slug, chainId, account) => void dispatch(setEvmTokenStatusAction({ account, chainId, slug, status })),
  (slug, chainId, account) => void dispatch(setEvmTokenStatusAction({ account, chainId, slug, status: 'removed' }))
);

interface DefaultListItemLayoutProps<T extends TempleChainKind> {
  assetSlug: string;
  assetName: string;
  className?: string;
  network: NetworkEssentials<T>;
  index?: number;
  balance: BigNumber;
  onClick?: MouseEventHandler<TokenListItemElement>;
  requiresVisibility?: boolean;
  showFavoritesMark?: boolean;
  showOnlyFavorites: boolean;
}

const DefaultListItemLayoutHOC = <T extends TempleChainKind>(
  networkKind: T,
  AssetIconWithNetwork: FC<{
    chainId: ChainId<T>;
    assetSlug: string;
    className?: string;
  }>
) =>
  forwardRef<TokenListItemElement, PropsWithChildren<DefaultListItemLayoutProps<T>>>(
    (
      {
        children,
        assetSlug,
        assetName,
        className,
        network,
        index,
        balance,
        onClick,
        requiresVisibility,
        showFavoritesMark,
        showOnlyFavorites
      },
      ref
    ) => {
      const { chainId } = network;
      const isVisible = useIsItemVisible(index);
      const visible = !requiresVisibility || isVisible;

      const chainAssetSlug = toChainAssetSlug(networkKind, chainId, assetSlug);

      const { toggleFavoriteToken, isFavorite } = useFavoriteTokens();
      const isFavoriteToken = isFavorite(chainAssetSlug);

      const handleFavoriteClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
        e => {
          e.preventDefault();
          e.stopPropagation();

          toggleFavoriteToken(chainAssetSlug);
        },
        [chainAssetSlug, toggleFavoriteToken]
      );

      if (showOnlyFavorites && !isFavoriteToken) {
        return null;
      }

      return (
        <Link
          to={toExploreAssetLink(false, networkKind, chainId, assetSlug)}
          className={clsx(LIST_ITEM_CLASSNAME, className)}
          onClick={onClick}
          testID={AssetsSelectors.assetItemButton}
          testIDProperties={{ key: `${assetSlug}-${chainId}` }}
          ref={ref as ForwardedRef<HTMLAnchorElement>}
          {...setAnotherSelector('name', assetName)}
        >
          {visible ? (
            <>
              <AssetIconWithNetwork chainId={chainId} assetSlug={assetSlug} className="shrink-0" />

              <div className="flex-grow flex flex-col gap-y-1 overflow-hidden">
                <div className="flex gap-x-4">
                  {children}

                  <CryptoBalance
                    value={balance}
                    testID={AssetsSelectors.assetItemCryptoBalanceButton}
                    testIDProperties={{ assetSlug }}
                  />
                </div>

                <div className="flex gap-x-4">
                  <div className="self-center flex-grow text-font-description text-grey-1 truncate">{assetName}</div>

                  <FiatBalance
                    evm={networkKind === TempleChainKind.EVM}
                    chainId={chainId}
                    assetSlug={assetSlug}
                    value={balance}
                    testID={AssetsSelectors.assetItemFiatBalanceButton}
                    testIDProperties={{ assetSlug }}
                  />
                </div>
              </div>
              {showFavoritesMark && (
                <button
                  type="button"
                  className="px-2 py-2.5 h-full z-10"
                  onClick={handleFavoriteClick}
                  aria-label={isFavoriteToken ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavoriteToken ? <StarFillIcon /> : <StarIcon />}
                </button>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-center relative shrink-0" style={{ width: 40, height: 40 }}>
                <div className="rounded-full bg-grey-3" style={{ width: 30, height: 30 }} />
                <div className="absolute bottom-0 right-0 rounded-full bg-grey-3" style={{ width: 16, height: 16 }} />
              </div>

              <div className="flex-grow flex flex-col gap-y-1 overflow-hidden">
                <div className="flex justify-between gap-x-4">
                  <div className="w-10 h-5 bg-grey-3 rounded" />
                  <div className="w-20 h-5 bg-grey-3 rounded" />
                </div>

                <div className="flex justify-between gap-x-4">
                  <div className="w-20 h-4 bg-grey-3 rounded" />
                  <div className="w-10 h-4 bg-grey-3 rounded" />
                </div>
              </div>
            </>
          )}
        </Link>
      );
    }
  );
const DefaultTezosListItemLayout = DefaultListItemLayoutHOC<TempleChainKind.Tezos>(
  TempleChainKind.Tezos,
  ({ chainId, ...restProps }) => <TezosAssetIconWithNetwork tezosChainId={chainId} {...restProps} />
);
const DefaultEvmListItemLayout = DefaultListItemLayoutHOC<TempleChainKind.EVM>(
  TempleChainKind.EVM,
  ({ chainId, ...restProps }) => <EvmAssetIconWithNetwork evmChainId={chainId} {...restProps} />
);
