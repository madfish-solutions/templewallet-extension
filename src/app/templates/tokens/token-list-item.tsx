import { CSSProperties, FC, PropsWithChildren, memo, MouseEventHandler, useCallback } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { IconBase, ToggleSwitch } from 'app/atoms';
import { ReactComponent as DeleteIcon } from 'app/icons/base/delete.svg';
import { ReactComponent as StarIcon } from 'app/icons/star.svg';
import { ReactComponent as StarFillIcon } from 'app/icons/starfill.svg';
import { dispatch } from 'app/store';
import { setEvmTokenStatusAction } from 'app/store/evm/assets/actions';
import { useStoredEvmTokenSelector } from 'app/store/evm/assets/selectors';
import { use3RouteEvmTokenMetadataSelector } from 'app/store/evm/swap-3route-metadata/selectors';
import { useLifiEvmTokenMetadataSelector } from 'app/store/evm/swap-lifi-metadata/selectors';
import { setTezosTokenStatusAction } from 'app/store/tezos/assets/actions';
import { useStoredTezosTokenSelector } from 'app/store/tezos/assets/selectors';
import { EvmAssetIconWithNetwork, TezosAssetIconWithNetwork } from 'app/templates/AssetIcon';
import { DeleteAssetModal } from 'app/templates/remove-asset-modal/delete-asset-modal';
import { ScamTag } from 'app/templates/scam-tag';
import { setAnotherSelector } from 'lib/analytics';
import { TEMPLE_TOKEN_SLUG } from 'lib/assets';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { getAssetStatus } from 'lib/assets/hooks/utils';
import { toChainAssetSlug } from 'lib/assets/utils';
import { useEvmTokenBalance, useTezosAssetBalance } from 'lib/balances/hooks';
import { ASSET_HUGE_AMOUNT } from 'lib/constants';
import { getTokenName, getAssetSymbol } from 'lib/metadata';
import { useBooleanState } from 'lib/ui/hooks';
import { toExploreAssetLink } from 'lib/ui/links';
import { TokenListItemElement } from 'lib/ui/tokens-list';
import { ZERO } from 'lib/utils/numbers';
import { Link } from 'lib/woozie';
import { ChainId, PublicKeyHash } from 'temple/front/chains';
import { useFavoriteTokens } from 'temple/front/use-favorite-tokens';
import { EvmNetworkEssentials, NetworkEssentials, TezosNetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { AssetsSelectors } from './assets.selectors';
import { CryptoBalance, FiatBalance } from './balance';
import { TokenTag } from './token-tag';
import { EvmIncentiveTag } from './token-tag/EvmIncentiveTag';

const LIST_ITEM_CLASSNAME = clsx(
  'flex items-center gap-x-1 p-2 rounded-lg',
  'transition ease-in-out duration-200 focus:outline-hidden'
);
// A row is p-2 (1rem) around the taller of the 40px icon and its two text lines (1.25rem + 0.25rem gap + 1rem): the virtual
// slot height and the contain-intrinsic-size (content box only) below must follow any change to that markup
export const getTokenListItemHeight = (rem: number) => rem + Math.max(40, 2.5 * rem);

const LIST_ITEM_STYLE: CSSProperties = {
  contentVisibility: 'auto',
  containIntrinsicSize: '0 max(40px, 2.5rem)'
};

interface TezosTokenListItemProps {
  network: TezosNetworkEssentials;
  publicKeyHash: string;
  assetSlug: string;
  active?: boolean;
  scam?: boolean;
  manageActive?: boolean;
  showTags?: boolean;
  showFavoritesMark?: boolean;
  showOnlyFavorites?: boolean;
  onClick?: MouseEventHandler<TokenListItemElement>;
}

export const TezosTokenListItem = memo<TezosTokenListItemProps>(
  ({
    network,
    publicKeyHash,
    assetSlug,
    active,
    scam,
    manageActive = false,
    showTags = true,
    showFavoritesMark = false,
    showOnlyFavorites = false,
    onClick
  }) => {
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
          publicKeyHash={publicKeyHash}
          onClick={onClick}
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
        balance={balance}
        onClick={onClick}
      >
        <div className="flex items-center grow gap-x-2 truncate">
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
);

interface EvmTokenListItemProps {
  network: EvmNetworkEssentials;
  publicKeyHash: HexString;
  assetSlug: string;
  manageActive?: boolean;
  showTags?: boolean;
  showFavoritesMark?: boolean;
  showOnlyFavorites?: boolean;
  onClick?: MouseEventHandler<TokenListItemElement>;
}

export const EvmTokenListItem = memo<EvmTokenListItemProps>(
  ({
    network,
    publicKeyHash,
    assetSlug,
    manageActive = false,
    showTags = false,
    showFavoritesMark = false,
    showOnlyFavorites = false,
    onClick
  }) => {
    const { chainId } = network;
    const lifiTokenMetadata = useLifiEvmTokenMetadataSelector(chainId, assetSlug);
    const route3EvmTokenMetadata = use3RouteEvmTokenMetadataSelector(chainId, assetSlug);
    const dexTokenMetadata = lifiTokenMetadata ?? route3EvmTokenMetadata;

    const {
      value: balance = ZERO,
      rawValue: rawBalance,
      metadata
    } = useEvmTokenBalance(assetSlug, publicKeyHash, network);
    const storedToken = useStoredEvmTokenSelector(publicKeyHash, chainId, assetSlug);

    const checked = getAssetStatus(rawBalance, storedToken?.status) === 'enabled';

    // evmTokenWillRender (lib/ui/tokens-list.tsx) mirrors this: the virtual lists reserve no slot for a row that renders null
    if (metadata == null && dexTokenMetadata == null) return null;

    const assetSymbol = getAssetSymbol(metadata?.decimals ? metadata : dexTokenMetadata);
    const assetName = getTokenName(metadata?.decimals ? metadata : dexTokenMetadata);

    if (manageActive)
      return (
        <ManageEvmActiveListItemLayout
          assetSlug={assetSlug}
          assetSymbol={assetSymbol}
          assetName={assetName}
          className="focus:bg-secondary-low hover:bg-secondary-low"
          checked={checked}
          network={network}
          publicKeyHash={publicKeyHash}
          onClick={onClick}
        />
      );

    return (
      <DefaultEvmListItemLayout
        assetSlug={assetSlug}
        assetName={assetName}
        className="focus:bg-secondary-low hover:bg-secondary-low"
        network={network}
        showFavoritesMark={showFavoritesMark}
        showOnlyFavorites={showOnlyFavorites}
        balance={balance}
        onClick={onClick}
      >
        <div className={clsx('flex items-center grow gap-x-2', balance.lt(ASSET_HUGE_AMOUNT) && 'truncate')}>
          <div className="text-font-medium truncate">{assetSymbol}</div>
          {showTags && <EvmIncentiveTag chainId={chainId} assetSlug={assetSlug} symbol={assetSymbol} />}
        </div>
      </DefaultEvmListItemLayout>
    );
  }
);

interface ManageActiveListItemLayoutProps<T extends TempleChainKind> {
  assetSlug: string;
  assetSymbol: string;
  assetName: string;
  className?: string;
  scam?: boolean;
  checked: boolean;
  network: NetworkEssentials<T>;
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
  memo<ManageActiveListItemLayoutProps<T>>(
    ({ assetSlug, assetSymbol, assetName, className, scam, checked, network, publicKeyHash, onClick }) => {
      const { chainId } = network;
      const [deleteModalOpened, setDeleteModalOpened, setDeleteModalClosed] = useBooleanState(false);
      const isUnmanageable = UNMANAGABLE_TOKENS_SLUGS[networkKind].includes(assetSlug);

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
          <div className={clsx(LIST_ITEM_CLASSNAME, className)} onClick={onClick} style={LIST_ITEM_STYLE}>
            <AssetIconWithNetwork chainId={chainId} assetSlug={assetSlug} className="shrink-0" />

            <div className="grow flex gap-x-2 items-center overflow-hidden">
              <div className="grow flex flex-col gap-y-1 overflow-hidden">
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
          </div>

          {deleteModalOpened && <DeleteAssetModal onClose={setDeleteModalClosed} onDelete={handleDeleteClick} />}
        </>
      );
    }
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
  balance: BigNumber;
  onClick?: MouseEventHandler<TokenListItemElement>;
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
  memo<PropsWithChildren<DefaultListItemLayoutProps<T>>>(
    ({
      children,
      assetSlug,
      assetName,
      className,
      network,
      balance,
      onClick,
      showFavoritesMark,
      showOnlyFavorites
    }) => {
      const { chainId } = network;

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
          style={LIST_ITEM_STYLE}
          testID={AssetsSelectors.assetItemButton}
          testIDProperties={{ key: `${assetSlug}-${chainId}` }}
          {...setAnotherSelector('name', assetName)}
        >
          <AssetIconWithNetwork chainId={chainId} assetSlug={assetSlug} className="shrink-0" />

          <div className="grow flex flex-col gap-y-1 overflow-hidden">
            <div className="flex gap-x-4">
              {children}

              <CryptoBalance
                value={balance}
                testID={AssetsSelectors.assetItemCryptoBalanceButton}
                testIDProperties={{ assetSlug }}
              />
            </div>

            <div className="flex gap-x-4">
              <div className="self-center grow text-font-description text-grey-1 truncate">{assetName}</div>

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
