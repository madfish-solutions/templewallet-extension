import React, { FC, memo } from 'react';

import clsx from 'clsx';

import { Identicon } from 'app/atoms';
import { EvmNetworkLogo, NetworkLogoTooltipWrap, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as CollectiblePlaceholder } from 'app/icons/collectible-placeholder.svg';
import { useEvmTokenMetadataSelector } from 'app/store/evm/tokens-metadata/selectors';
import { AssetMetadataBase, getAssetSymbol, isCollectible, useTezosAssetMetadata } from 'lib/metadata';
import { EvmTokenMetadata } from 'lib/metadata/types';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { useEvmChainByChainId, useTezosChainByChainId } from 'temple/front/chains';

import { TezosAssetImage, AssetImageBaseProps, EvmAssetImage } from './AssetImage';

interface TezosAssetIconProps extends Omit<AssetImageBaseProps, 'sources' | 'metadata' | 'loader' | 'fallback'> {
  tezosChainId: string;
  assetSlug: string;
  Loader?: React.ComponentType;
  Fallback?: React.ComponentType;
}

export const TezosAssetIcon = memo<TezosAssetIconProps>(
  ({ tezosChainId, className, style, Loader, Fallback, ...props }) => {
    const metadata = useTezosAssetMetadata(props.assetSlug, tezosChainId);

    return (
      <div className={clsx('flex items-center justify-center', className)} style={style}>
        <TezosAssetImage
          {...props}
          metadata={metadata}
          loader={Loader ? <Loader /> : <AssetIconPlaceholder metadata={metadata} size={props.size} />}
          fallback={Fallback ? <Fallback /> : <AssetIconPlaceholder metadata={metadata} size={props.size} />}
        />
      </div>
    );
  }
);

interface EvmAssetIconProps extends Omit<AssetImageBaseProps, 'sources' | 'metadata' | 'loader' | 'fallback'> {
  evmChainId: number;
  assetSlug: string;
  Loader?: React.ComponentType;
  Fallback?: React.ComponentType;
}

export const EvmTokenIcon = memo<EvmAssetIconProps>(({ evmChainId, assetSlug, Loader, Fallback, ...props }) => {
  const network = useEvmChainByChainId(evmChainId);
  const tokenMetadata = useEvmTokenMetadataSelector(evmChainId, assetSlug);

  const metadata = isEvmNativeTokenSlug(assetSlug) ? network?.currency : tokenMetadata;

  return (
    <EvmAssetImage
      {...props}
      evmChainId={evmChainId}
      metadata={metadata}
      loader={Loader ? <Loader /> : <AssetIconPlaceholder metadata={metadata} size={props.size} />}
      fallback={Fallback ? <Fallback /> : <AssetIconPlaceholder metadata={metadata} size={props.size} />}
    />
  );
});

const ICON_DEFAULT_SIZE = 40;
const ASSET_IMAGE_DEFAULT_SIZE = 30;
const NETWORK_IMAGE_DEFAULT_SIZE = 16;

interface TezosTokenIconWithNetworkProps
  extends Omit<AssetImageBaseProps, 'sources' | 'metadata' | 'loader' | 'fallback' | 'size'> {
  tezosChainId: string;
  assetSlug: string;
}

export const TezosTokenIconWithNetwork = memo<TezosTokenIconWithNetworkProps>(
  ({ tezosChainId, className, style, ...props }) => {
    const network = useTezosChainByChainId(tezosChainId);
    const metadata = useTezosAssetMetadata(props.assetSlug, tezosChainId);

    return (
      <div
        className={clsx('flex items-center justify-center relative', className)}
        style={{ width: ICON_DEFAULT_SIZE, height: ICON_DEFAULT_SIZE, ...style }}
      >
        <TezosAssetImage
          {...props}
          metadata={metadata}
          size={ASSET_IMAGE_DEFAULT_SIZE}
          className="rounded-full"
          loader={<AssetIconPlaceholder metadata={metadata} size={ASSET_IMAGE_DEFAULT_SIZE} />}
          fallback={<AssetIconPlaceholder metadata={metadata} size={ASSET_IMAGE_DEFAULT_SIZE} />}
        />

        {network && (
          <NetworkLogoTooltipWrap networkName={network.name} className="absolute bottom-0 right-0">
            <TezosNetworkLogo size={NETWORK_IMAGE_DEFAULT_SIZE} chainId={network.chainId} networkName={network.name} />
          </NetworkLogoTooltipWrap>
        )}
      </div>
    );
  }
);

interface EvmTokenIconWithNetworkProps
  extends Omit<AssetImageBaseProps, 'sources' | 'metadata' | 'loader' | 'fallback' | 'size'> {
  evmChainId: number;
  assetSlug: string;
}

export const EvmTokenIconWithNetwork = memo<EvmTokenIconWithNetworkProps>(
  ({ evmChainId, assetSlug, className, style, ...props }) => {
    const network = useEvmChainByChainId(evmChainId);
    const tokenMetadata = useEvmTokenMetadataSelector(evmChainId, assetSlug);

    const metadata = isEvmNativeTokenSlug(assetSlug) ? network?.currency : tokenMetadata;

    return (
      <div
        className={clsx('flex items-center justify-center relative', className)}
        style={{ width: ICON_DEFAULT_SIZE, height: ICON_DEFAULT_SIZE, ...style }}
      >
        <EvmAssetImage
          {...props}
          evmChainId={evmChainId}
          metadata={metadata}
          size={ASSET_IMAGE_DEFAULT_SIZE}
          className="rounded-full"
          loader={<AssetIconPlaceholder metadata={metadata} size={ASSET_IMAGE_DEFAULT_SIZE} />}
          fallback={<AssetIconPlaceholder metadata={metadata} size={ASSET_IMAGE_DEFAULT_SIZE} />}
        />

        {network && (
          <NetworkLogoTooltipWrap networkName={network.name} className="absolute bottom-0 right-0">
            <EvmNetworkLogo networkName={network.name} chainId={network.chainId} size={NETWORK_IMAGE_DEFAULT_SIZE} />
          </NetworkLogoTooltipWrap>
        )}
      </div>
    );
  }
);

interface PlaceholderProps {
  metadata: EvmTokenMetadata | AssetMetadataBase | nullish;
  size?: number;
}

const AssetIconPlaceholder: FC<PlaceholderProps> = ({ metadata, size }) => {
  return metadata && isCollectible(metadata) ? (
    <CollectiblePlaceholder style={{ maxWidth: `${size}px`, width: '100%', height: '100%' }} />
  ) : (
    <Identicon type="initials" hash={getAssetSymbol(metadata)} size={size} className="rounded-full" />
  );
};
