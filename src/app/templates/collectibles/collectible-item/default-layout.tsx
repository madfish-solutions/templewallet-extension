import { FC, Ref } from 'react';

import clsx from 'clsx';

import { EvmNetworkLogo, NetworkLogoPropsBase, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { SearchHighlightText } from 'app/atoms/SearchHighlightText';
import { useIsItemVisible } from 'app/atoms/visibility-tracking-infinite-scroll';
import { useCollectiblesSearchState } from 'app/hooks/use-assets-view-state';
import { ScamTag } from 'app/templates/scam-tag';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { toExploreAssetLink } from 'lib/ui/links';
import { Link } from 'lib/woozie';
import { ChainId, ChainOfKind, useEvmChainByChainId, useTezosChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { CollectibleImageLoader } from '../collectible-image-loader';
import { EvmCollectibleItemImage, TezosCollectibleItemImage } from '../collectible-item-image';

import { CommonLayoutProps } from './types';

const NETWORK_IMAGE_DEFAULT_SIZE = 16;

interface DefaultCollectibleListItemLayoutProps<T extends TempleChainKind> extends CommonLayoutProps<T> {
  showDetails: boolean;
  metadatasLoading: boolean;
}

const DefaultCollectibleListItemLayoutHOC = <
  T extends TempleChainKind,
  P extends DefaultCollectibleListItemLayoutProps<T> = DefaultCollectibleListItemLayoutProps<T>
>(
  chainKind: T,
  NetworkLogo: FC<NetworkLogoPropsBase<T>>,
  CollectibleItemImage: FC<
    Pick<P, 'metadata' | 'assetSlug' | 'wrapperElemRef'> & Omit<P, keyof DefaultCollectibleListItemLayoutProps<T>>
  >,
  useNetwork: (chainId: ChainId<T>) => ChainOfKind<T> | nullish,
  className?: string
) => {
  function DefaultCollectibleListItemLayout(props: P) {
    const {
      wrapperElemRef,
      assetSlug,
      assetName,
      metadata,
      chainId,
      showDetails,
      metadatasLoading,
      scam,
      index,
      ref,
      isVisible: isVisibleFromProps,
      testID,
      nameTestID,
      ...restProps
    } = props;

    const { searchValue } = useCollectiblesSearchState();
    const network = useNetwork(chainId);
    const defaultIsVisible = useIsItemVisible(index);
    const isVisible = isVisibleFromProps ?? defaultIsVisible;

    return (
      <Link
        to={toExploreAssetLink(true, chainKind, chainId, assetSlug)}
        className={clsx('flex flex-col overflow-hidden group', className)}
        testID={testID}
        testIDProperties={{ assetSlug }}
        ref={ref as Ref<HTMLAnchorElement>}
      >
        <div
          ref={wrapperElemRef}
          className={clsx(
            'relative flex items-center justify-center bg-grey-4 rounded-8 overflow-hidden w-full aspect-square',
            isVisible && 'border-2 border-transparent',
            scam && isVisible ? 'hover:bg-error' : 'group-hover:border-secondary'
          )}
        >
          {scam && (
            <div className="absolute z-50 top-1.5 left-1.5 ">
              <ScamTag />
            </div>
          )}
          {!isVisible && (
            <>
              <div className="w-full h-full z-1 bg-grey-3" />
              <div
                className="absolute bottom-1 right-1 z-10 rounded-full bg-grey-2"
                style={{ width: NETWORK_IMAGE_DEFAULT_SIZE, height: NETWORK_IMAGE_DEFAULT_SIZE }}
              />
            </>
          )}
          {metadatasLoading && !metadata && isVisible && <CollectibleImageLoader />}
          {(!metadatasLoading || metadata) && isVisible && (
            <>
              <CollectibleItemImage metadata={metadata} assetSlug={assetSlug} {...restProps} />

              {network && (
                <NetworkLogo
                  chainId={network.chainId}
                  size={NETWORK_IMAGE_DEFAULT_SIZE}
                  className="absolute bottom-1 right-1 z-10"
                  withTooltip
                  tooltipPlacement="bottom"
                />
              )}
            </>
          )}
        </div>

        {showDetails && isVisible && (
          <div
            className="pt-1 w-full text-font-description truncate h-5"
            {...setTestID(nameTestID)}
            {...setAnotherSelector('name', assetName)}
          >
            <SearchHighlightText searchValue={searchValue}>{assetName}</SearchHighlightText>
          </div>
        )}
        {showDetails && !isVisible && (
          <div className="pt-1 w-full h-5">
            <div className="w-full h-4 bg-grey-3 rounded" />
          </div>
        )}
      </Link>
    );
  }

  return DefaultCollectibleListItemLayout;
};

export const DefaultTezosListItemLayout = DefaultCollectibleListItemLayoutHOC<
  TempleChainKind.Tezos,
  DefaultCollectibleListItemLayoutProps<TempleChainKind.Tezos> & {
    adultBlur: boolean;
    areDetailsLoading: boolean;
    mime: string | nullish;
    extraSrc?: string;
    wrapperElemRef: Ref<HTMLDivElement>;
  }
>(
  TempleChainKind.Tezos,
  TezosNetworkLogo,
  ({ wrapperElemRef, ...restProps }) => (
    <TezosCollectibleItemImage
      shouldUseBlurredBg
      containerElemRef={wrapperElemRef}
      className="object-contain"
      {...restProps}
    />
  ),
  useTezosChainByChainId,
  'items-center justify-center'
);

export const DefaultEvmListItemLayout = DefaultCollectibleListItemLayoutHOC<TempleChainKind.EVM>(
  TempleChainKind.EVM,
  EvmNetworkLogo,
  ({ metadata }) => <EvmCollectibleItemImage shouldUseBlurredBg metadata={metadata} className="object-contain" />,
  useEvmChainByChainId
);
