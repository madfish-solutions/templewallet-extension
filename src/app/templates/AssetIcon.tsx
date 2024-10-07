import React, { memo } from 'react';

import clsx from 'clsx';

import { Identicon } from 'app/atoms';
import { EvmNetworkLogo, NetworkLogoTooltipWrap, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as CollectiblePlaceholderSvg } from 'app/icons/collectible-placeholder.svg';
import { AssetMetadataBase } from 'lib/metadata';
import { EvmAssetMetadataBase } from 'lib/metadata/types';
import { getAssetSymbol, isEvmCollectibleMetadata, isTezosCollectibleMetadata } from 'lib/metadata/utils';
import { useEvmChainByChainId, useTezosChainByChainId } from 'temple/front/chains';

import { TezosAssetImage, TezosAssetImageProps, EvmAssetImage, EvmAssetImageProps } from './AssetImage';

export const TezosAssetIcon = memo<TezosAssetImageProps>(({ className, style, ...props }) => (
  <div className={clsx('flex items-center justify-center rounded-full overflow-hidden', className)} style={style}>
    <TezosAssetImage Loader={TezosAssetIconPlaceholder} Fallback={TezosAssetIconPlaceholder} {...props} />
  </div>
));

const TezosAssetIconPlaceholder: TezosAssetImageProps['Fallback'] = memo(({ metadata, size }) => (
  <AssetIconPlaceholder
    isCollectible={metadata && isTezosCollectibleMetadata(metadata)}
    metadata={metadata}
    size={size}
  />
));

const ICON_DEFAULT_SIZE = 40;
const ASSET_IMAGE_DEFAULT_SIZE = 30;
const NETWORK_IMAGE_DEFAULT_SIZE = 16;

export const TezosTokenIconWithNetwork = memo<TezosAssetImageProps>(({ tezosChainId, className, style, ...props }) => {
  const network = useTezosChainByChainId(tezosChainId);

  return (
    <div
      className={clsx('flex items-center justify-center relative', className)}
      style={{ width: ICON_DEFAULT_SIZE, height: ICON_DEFAULT_SIZE, ...style }}
    >
      <TezosAssetIcon tezosChainId={tezosChainId} size={ASSET_IMAGE_DEFAULT_SIZE} {...props} />

      {network && (
        <NetworkLogoTooltipWrap networkName={network.name} className="absolute bottom-0 right-0">
          <TezosNetworkLogo size={NETWORK_IMAGE_DEFAULT_SIZE} chainId={network.chainId} />
        </NetworkLogoTooltipWrap>
      )}
    </div>
  );
});

export const EvmAssetIcon = memo<EvmAssetImageProps>(({ className, style, ...props }) => (
  <div className={clsx('flex items-center justify-center rounded-full overflow-hidden', className)} style={style}>
    <EvmAssetImage Loader={EvmAssetIconPlaceholder} Fallback={EvmAssetIconPlaceholder} {...props} />
  </div>
));

const EvmAssetIconPlaceholder: EvmAssetImageProps['Fallback'] = memo(({ metadata, size }) => (
  <AssetIconPlaceholder
    isCollectible={metadata && isEvmCollectibleMetadata(metadata)}
    metadata={metadata}
    size={size}
  />
));

export const EvmTokenIconWithNetwork = memo<EvmAssetImageProps>(({ evmChainId, className, style, ...props }) => {
  const network = useEvmChainByChainId(evmChainId);

  return (
    <div
      className={clsx('flex items-center justify-center relative', className)}
      style={{ width: ICON_DEFAULT_SIZE, height: ICON_DEFAULT_SIZE, ...style }}
    >
      <EvmAssetIcon evmChainId={evmChainId} size={ASSET_IMAGE_DEFAULT_SIZE} {...props} />

      {network && (
        <NetworkLogoTooltipWrap networkName={network.name} className="absolute bottom-0 right-0">
          <EvmNetworkLogo chainId={network.chainId} size={NETWORK_IMAGE_DEFAULT_SIZE} />
        </NetworkLogoTooltipWrap>
      )}
    </div>
  );
});

const AssetIconPlaceholder = memo<{
  isCollectible?: boolean;
  metadata: AssetMetadataBase | EvmAssetMetadataBase | nullish;
  size?: number;
}>(({ isCollectible, metadata, size }) =>
  isCollectible ? (
    <CollectiblePlaceholderSvg style={{ maxWidth: `${size}px`, width: '100%', height: '100%' }} />
  ) : (
    <Identicon type="initials" hash={getAssetSymbol(metadata)} size={size} className="rounded-full" />
  )
);
