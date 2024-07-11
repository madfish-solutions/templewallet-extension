import React, { memo, useCallback, useMemo, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';
import clsx from 'clsx';

import { IconBase, ToggleSwitch } from 'app/atoms';
import Money from 'app/atoms/Money';
import { EvmNetworkLogo, NetworkLogoFallback } from 'app/atoms/NetworkLogo';
import { TezosNetworkLogo } from 'app/atoms/NetworksLogos';
import { ReactComponent as DeleteIcon } from 'app/icons/base/delete.svg';
import { dispatch } from 'app/store';
import { setEvmCollectibleStatusAction } from 'app/store/evm/assets/actions';
import { useStoredEvmCollectibleSelector } from 'app/store/evm/assets/selectors';
import { setTezosCollectibleStatusAction } from 'app/store/tezos/assets/actions';
import { useStoredTezosCollectibleSelector } from 'app/store/tezos/assets/selectors';
import { useBalanceSelector } from 'app/store/tezos/balances/selectors';
import {
  useAllCollectiblesDetailsLoadingSelector,
  useCollectibleDetailsSelector
} from 'app/store/tezos/collectibles/selectors';
import { useCollectibleMetadataSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import { DeleteAssetModal } from 'app/templates/remove-asset-modal/delete-asset-modal';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { objktCurrencies } from 'lib/apis/objkt';
import { getAssetStatus } from 'lib/assets/hooks/utils';
import { useEvmCollectibleBalance } from 'lib/balances/hooks';
import { T } from 'lib/i18n';
import { getTokenName } from 'lib/metadata';
import { getCollectibleName, getCollectionName } from 'lib/metadata/utils';
import { atomsToTokens } from 'lib/temple/helpers';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useBooleanState } from 'lib/ui/hooks';
import useTippy, { UseTippyOptions } from 'lib/ui/useTippy';
import { Link } from 'lib/woozie';
import { useEvmChainByChainId, useTezosChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { CollectibleTabSelectors } from '../selectors';
import { toCollectibleLink } from '../utils';

import { CollectibleItemImage, EvmCollectibleItemImage } from './CollectibleItemImage';

// Fixed sizes to improve large grid performance
const ImgContainerStyle = { width: 112, height: 112 };
const ImgWithDetailsContainerStyle = { width: 112, height: 152 };
const ImgStyle = { width: 110, height: 110 };
const manageImgStyle = { width: 42, height: 42 };
const DetailsStyle = { width: 112, height: 40 };
const NETWORK_IMAGE_DEFAULT_SIZE = 16;

interface TezosCollectibleItemProps {
  assetSlug: string;
  accountPkh: string;
  tezosChainId: string;
  adultBlur: boolean;
  areDetailsShown: boolean;
  hideWithoutMeta?: boolean;
  manageActive?: boolean;
}

export const TezosCollectibleItem = memo<TezosCollectibleItemProps>(
  ({ assetSlug, accountPkh, tezosChainId, adultBlur, areDetailsShown, hideWithoutMeta, manageActive = false }) => {
    const metadata = useCollectibleMetadataSelector(assetSlug);
    const wrapperElemRef = useRef<HTMLDivElement>(null);
    const balanceAtomic = useBalanceSelector(accountPkh, tezosChainId, assetSlug);

    const network = useTezosChainByChainId(tezosChainId);

    const tippyProps = useMemo<UseTippyOptions>(
      () => ({
        trigger: 'mouseenter',
        hideOnClick: false,
        content: network?.name ?? 'Unknown Network',
        animation: 'shift-away-subtle',
        placement: 'bottom'
      }),
      [network]
    );

    const storedToken = useStoredTezosCollectibleSelector(accountPkh, tezosChainId, assetSlug);

    const checked = getAssetStatus(balanceAtomic, storedToken?.status) === 'enabled';

    const [deleteModalOpened, setDeleteModalOpened, setDeleteModalClosed] = useBooleanState(false);

    const deleteItem = useCallback(
      () =>
        void dispatch(
          setTezosCollectibleStatusAction({
            account: accountPkh,
            chainId: tezosChainId,
            slug: assetSlug,
            status: 'removed'
          })
        ),
      [assetSlug, tezosChainId, accountPkh]
    );

    const toggleTokenStatus = useCallback(
      () =>
        void dispatch(
          setTezosCollectibleStatusAction({
            account: accountPkh,
            chainId: tezosChainId,
            slug: assetSlug,
            status: checked ? 'disabled' : 'enabled'
          })
        ),
      [checked, assetSlug, tezosChainId, accountPkh]
    );

    const networkIconRef = useTippy<HTMLDivElement>(tippyProps);

    const decimals = metadata?.decimals;

    const imgContainerStyles = useMemo(
      () => (areDetailsShown ? ImgWithDetailsContainerStyle : ImgContainerStyle),
      [areDetailsShown]
    );

    const balance = useMemo(
      () => (isDefined(decimals) && balanceAtomic ? atomsToTokens(balanceAtomic, decimals) : null),
      [balanceAtomic, decimals]
    );

    const areDetailsLoading = useAllCollectiblesDetailsLoadingSelector();
    const details = useCollectibleDetailsSelector(assetSlug);

    const collectionName = useMemo(
      () => details?.galleries[0]?.title ?? details?.fa.name ?? 'Unknown Collection',
      [details]
    );

    const listing = useMemo(() => {
      if (!details?.listing) return null;

      const { floorPrice, currencyId } = details.listing;

      const currency = objktCurrencies[currencyId];

      if (!isDefined(currency)) return null;

      return { floorPrice: atomsToTokens(floorPrice, currency.decimals).toString(), symbol: currency.symbol };
    }, [details?.listing]);

    if (hideWithoutMeta && !metadata) return null;

    const assetName = getTokenName(metadata);

    return manageActive ? (
      <>
        <div
          className={clsx(
            'flex flex-row items-center justify-between w-full overflow-hidden p-2 rounded-lg',
            'hover:bg-secondary-low transition ease-in-out duration-200 focus:outline-none',
            'focus:bg-secondary-low'
          )}
        >
          <div className="flex flex-row items-center gap-x-1.5">
            <div
              ref={wrapperElemRef}
              style={manageImgStyle}
              className="relative flex items-center justify-center bg-blue-50 rounded-lg overflow-hidden hover:opacity-70"
            >
              <CollectibleItemImage
                assetSlug={assetSlug}
                metadata={metadata}
                adultBlur={adultBlur}
                areDetailsLoading={areDetailsLoading && details === undefined}
                mime={details?.mime}
                containerElemRef={wrapperElemRef}
              />

              {network && (
                <div ref={networkIconRef} className="absolute bottom-0.5 right-0.5">
                  {network.chainId === TEZOS_MAINNET_CHAIN_ID ? (
                    <TezosNetworkLogo size={NETWORK_IMAGE_DEFAULT_SIZE} />
                  ) : (
                    <NetworkLogoFallback networkName={network.name} size={NETWORK_IMAGE_DEFAULT_SIZE} />
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col truncate max-w-40">
              <div className="text-font-medium mb-1">{assetName}</div>
              <div className="flex text-font-description items-center text-grey-1 flex-1">{collectionName}</div>
            </div>
          </div>

          <div className="flex flex-row gap-x-2">
            <IconBase
              Icon={DeleteIcon}
              size={16}
              className="cursor-pointer text-primary"
              onClick={setDeleteModalOpened}
            />
            <ToggleSwitch checked={checked} onChange={toggleTokenStatus} />
          </div>
        </div>
        {deleteModalOpened && <DeleteAssetModal onClose={setDeleteModalClosed} onDelete={deleteItem} />}
      </>
    ) : (
      <Link
        to={toCollectibleLink(TempleChainKind.Tezos, tezosChainId, assetSlug)}
        className="flex flex-col border border-gray-300 rounded-lg overflow-hidden"
        style={imgContainerStyles}
        testID={CollectibleTabSelectors.collectibleItem}
        testIDProperties={{ assetSlug: assetSlug }}
      >
        <div
          ref={wrapperElemRef}
          style={ImgStyle}
          className={clsx(
            'relative flex items-center justify-center bg-blue-50 rounded-lg overflow-hidden hover:opacity-70',
            areDetailsShown && 'border-b border-gray-300'
          )}
        >
          <CollectibleItemImage
            assetSlug={assetSlug}
            metadata={metadata}
            adultBlur={adultBlur}
            areDetailsLoading={areDetailsLoading && details === undefined}
            mime={details?.mime}
            containerElemRef={wrapperElemRef}
          />

          {areDetailsShown && balance && (
            <div className="absolute bottom-1.5 left-1.5 text-xxxs text-white leading-none p-1 bg-black bg-opacity-60 rounded">
              {balance.toFixed()}×
            </div>
          )}

          {network && (
            <div ref={networkIconRef} className="absolute bottom-1 right-1">
              {network.chainId === TEZOS_MAINNET_CHAIN_ID ? (
                <TezosNetworkLogo size={NETWORK_IMAGE_DEFAULT_SIZE} />
              ) : (
                <NetworkLogoFallback networkName={network.name} size={NETWORK_IMAGE_DEFAULT_SIZE} />
              )}
            </div>
          )}
        </div>

        {areDetailsShown && (
          <div style={DetailsStyle} className="pt-1 px-1.5">
            <h5 className="text-sm leading-5 text-gray-910 truncate">{assetName}</h5>
            <div
              className="mt-0.5 text-xxxs leading-3 text-gray-600"
              {...setTestID(CollectibleTabSelectors.collectibleName)}
              {...setAnotherSelector('name', assetName)}
            >
              <span {...setTestID(CollectibleTabSelectors.floorPrice)}>
                <T id="floorPrice" />:{' '}
              </span>

              {isDefined(listing) ? (
                <>
                  <Money shortened smallFractionFont={false} tooltip={true}>
                    {listing.floorPrice}
                  </Money>
                  <span>{listing.symbol}</span>
                </>
              ) : (
                '-'
              )}
            </div>
          </div>
        )}
      </Link>
    );
  }
);

interface EvmCollectibleItemProps {
  assetSlug: string;
  evmChainId: number;
  accountPkh: HexString;
  showDetails?: boolean;
  manageActive?: boolean;
}

export const EvmCollectibleItem = memo<EvmCollectibleItemProps>(
  ({ assetSlug, evmChainId, accountPkh, showDetails = false, manageActive = false }) => {
    const { rawValue: balance = '0', metadata } = useEvmCollectibleBalance(assetSlug, accountPkh, evmChainId);

    const storedToken = useStoredEvmCollectibleSelector(accountPkh, evmChainId, assetSlug);

    const checked = getAssetStatus(balance, storedToken?.status) === 'enabled';

    const [deleteModalOpened, setDeleteModalOpened, setDeleteModalClosed] = useBooleanState(false);

    const deleteItem = useCallback(
      () =>
        void dispatch(
          setEvmCollectibleStatusAction({
            account: accountPkh,
            chainId: evmChainId,
            slug: assetSlug,
            status: 'removed'
          })
        ),
      [assetSlug, evmChainId, accountPkh]
    );

    const toggleTokenStatus = useCallback(
      () =>
        void dispatch(
          setEvmCollectibleStatusAction({
            account: accountPkh,
            chainId: evmChainId,
            slug: assetSlug,
            status: checked ? 'disabled' : 'enabled'
          })
        ),
      [checked, assetSlug, evmChainId, accountPkh]
    );

    const truncatedBalance = useMemo(() => (balance.length > 6 ? `${balance.slice(0, 6)}...` : balance), [balance]);

    const network = useEvmChainByChainId(evmChainId);

    const tippyProps = useMemo<UseTippyOptions>(
      () => ({
        trigger: 'mouseenter',
        hideOnClick: false,
        content: network?.name ?? 'Unknown Network',
        animation: 'shift-away-subtle',
        placement: 'bottom'
      }),
      [network]
    );

    const networkIconRef = useTippy<HTMLDivElement>(tippyProps);

    const imgContainerStyles = useMemo(
      () => (showDetails ? ImgWithDetailsContainerStyle : ImgContainerStyle),
      [showDetails]
    );

    if (!metadata) return null;

    const assetName = getCollectibleName(metadata);
    const collectionName = getCollectionName(metadata);

    return manageActive ? (
      <>
        <div
          className={clsx(
            'flex flex-row items-center justify-between w-full overflow-hidden p-2 rounded-lg',
            'hover:bg-secondary-low transition ease-in-out duration-200 focus:outline-none',
            'focus:bg-secondary-low'
          )}
        >
          <div className="flex flex-row items-center gap-x-1.5">
            <div
              className={clsx(
                'relative flex items-center justify-center bg-blue-50 rounded-lg overflow-hidden hover:opacity-70'
              )}
              style={manageImgStyle}
            >
              <EvmCollectibleItemImage metadata={metadata} />

              {network && (
                <EvmNetworkLogo
                  ref={networkIconRef}
                  className="absolute bottom-0.5 right-0.5"
                  networkName={network.name}
                  chainId={network.chainId}
                  size={NETWORK_IMAGE_DEFAULT_SIZE}
                />
              )}
            </div>

            <div className="flex flex-col truncate max-w-40">
              <div className="text-font-medium mb-1">{assetName}</div>
              <div className="flex text-font-description items-center text-grey-1 flex-1">{collectionName}</div>
            </div>
          </div>

          <div className="flex flex-row gap-x-2">
            <IconBase
              Icon={DeleteIcon}
              size={16}
              className="cursor-pointer text-primary"
              onClick={setDeleteModalOpened}
            />
            <ToggleSwitch checked={checked} onChange={toggleTokenStatus} />
          </div>
        </div>
        {deleteModalOpened && <DeleteAssetModal onClose={setDeleteModalClosed} onDelete={deleteItem} />}
      </>
    ) : (
      <Link
        to={toCollectibleLink(TempleChainKind.EVM, evmChainId, assetSlug)}
        className="flex flex-col border border-gray-300 rounded-lg overflow-hidden"
        style={imgContainerStyles}
        testID={CollectibleTabSelectors.collectibleItem}
        testIDProperties={{ assetSlug: assetSlug }}
      >
        <div
          className={clsx(
            'relative flex items-center justify-center bg-blue-50 rounded-lg overflow-hidden hover:opacity-70'
          )}
          style={ImgStyle}
        >
          <EvmCollectibleItemImage metadata={metadata} />

          {showDetails && (
            <div className="absolute bottom-1.5 left-1.5 text-xxxs text-white leading-none p-1 bg-black bg-opacity-60 rounded">
              {truncatedBalance}×
            </div>
          )}

          {network && (
            <EvmNetworkLogo
              ref={networkIconRef}
              className="absolute bottom-1 right-1"
              networkName={network.name}
              chainId={network.chainId}
              size={NETWORK_IMAGE_DEFAULT_SIZE}
            />
          )}
        </div>

        {showDetails && (
          <div style={DetailsStyle} className="pt-1 px-1.5">
            <h5 className="text-sm leading-5 text-gray-910 truncate">{assetName}</h5>
            <div
              className="mt-0.5 text-xxxs leading-3 text-gray-600"
              {...setTestID(CollectibleTabSelectors.collectibleName)}
              {...setAnotherSelector('name', assetName)}
            >
              <span {...setTestID(CollectibleTabSelectors.floorPrice)}>
                <T id="floorPrice" />:{' -'}
              </span>
            </div>
          </div>
        )}
      </Link>
    );
  }
);
