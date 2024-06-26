import React, { memo, useMemo, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';
import clsx from 'clsx';

import Money from 'app/atoms/Money';
import { EvmNetworkLogo, NetworkLogoFallback } from 'app/atoms/NetworkLogo';
import { TezosNetworkLogo } from 'app/atoms/NetworksLogos';
import { useBalanceSelector } from 'app/store/tezos/balances/selectors';
import {
  useAllCollectiblesDetailsLoadingSelector,
  useCollectibleDetailsSelector
} from 'app/store/tezos/collectibles/selectors';
import { useCollectibleMetadataSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { objktCurrencies } from 'lib/apis/objkt';
import { useEvmCollectibleBalance } from 'lib/balances/hooks';
import { T } from 'lib/i18n';
import { getAssetName } from 'lib/metadata';
import { atomsToTokens } from 'lib/temple/helpers';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
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
const DetailsStyle = { width: 112, height: 40 };
const NETWORK_IMAGE_DEFAULT_SIZE = 16;

interface TezosCollectibleItemProps {
  assetSlug: string;
  accountPkh: string;
  tezosChainId: string;
  adultBlur: boolean;
  areDetailsShown: boolean;
  hideWithoutMeta?: boolean;
}

export const TezosCollectibleItem = memo<TezosCollectibleItemProps>(
  ({ assetSlug, accountPkh, tezosChainId, adultBlur, areDetailsShown, hideWithoutMeta }) => {
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

    const listing = useMemo(() => {
      if (!details?.listing) return null;

      const { floorPrice, currencyId } = details.listing;

      const currency = objktCurrencies[currencyId];

      if (!isDefined(currency)) return null;

      return { floorPrice: atomsToTokens(floorPrice, currency.decimals).toString(), symbol: currency.symbol };
    }, [details?.listing]);

    if (hideWithoutMeta && !metadata) return null;

    const assetName = getAssetName(metadata);

    return (
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
}

export const EvmCollectibleItem = memo<EvmCollectibleItemProps>(
  ({ assetSlug, evmChainId, accountPkh, showDetails = false }) => {
    const { rawValue: balance = '0', metadata } = useEvmCollectibleBalance(assetSlug, accountPkh, evmChainId);

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

    const assetName = getAssetName(metadata);

    return (
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
