import React, { memo } from 'react';

import clsx from 'clsx';

import { IdenticonInitials } from 'app/atoms/Identicon';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as CollectiblePlaceholderSvg } from 'app/icons/collectible-placeholder.svg';
import { useEvmGenericAssetMetadata, useGenericTezosAssetMetadata } from 'lib/metadata';
import { getAssetSymbol, isCollectible, isEvmCollectible, isEvmCollectibleMetadata } from 'lib/metadata/utils';
import { useEvmChainByChainId, useTezosChainByChainId } from 'temple/front/chains';

import { TezosAssetImage, TezosAssetImageProps, EvmAssetImage, EvmAssetImageProps } from './AssetImage';

export const TezosAssetIcon = memo<TezosAssetImageProps>(props => (
  <TezosAssetImage Loader={TezosAssetIconPlaceholder} Fallback={TezosAssetIconPlaceholder} {...props} />
));

const TezosAssetIconPlaceholder: TezosAssetImageProps['Fallback'] = memo(({ metadata, size, className, style }) =>
  metadata && isCollectible(metadata) ? (
    <CollectiblePlaceholderSvg className={className} style={style} width={size} height={size} />
  ) : (
    <IdenticonInitials
      value={getAssetSymbol(metadata)}
      className={className}
      style={style}
      width={size}
      height={size}
    />
  )
);

const ICON_DEFAULT_SIZE = 40;
const TOKEN_IMAGE_DEFAULT_SIZE = 30;
const COLLECTIBLE_IMAGE_DEFAULT_SIZE = 36;
const NETWORK_IMAGE_DEFAULT_SIZE = 16;

export const TezosAssetIconWithNetwork = memo<TezosAssetImageProps>(
  ({ assetSlug, tezosChainId, className, style, ...props }) => {
    const network = useTezosChainByChainId(tezosChainId);
    const metadata = useGenericTezosAssetMetadata(assetSlug, tezosChainId);

    return (
      <div
        className={clsx('flex items-center justify-center relative', className)}
        style={{ width: ICON_DEFAULT_SIZE, height: ICON_DEFAULT_SIZE, ...style }}
      >
        <TezosAssetIcon
          assetSlug={assetSlug}
          tezosChainId={tezosChainId}
          size={isCollectible(metadata) ? COLLECTIBLE_IMAGE_DEFAULT_SIZE : TOKEN_IMAGE_DEFAULT_SIZE}
          className={isCollectible(metadata) ? 'rounded-8' : 'rounded-full'}
          {...props}
        />

        {network && (
          <TezosNetworkLogo
            size={NETWORK_IMAGE_DEFAULT_SIZE}
            chainId={network.chainId}
            className="absolute bottom-0 right-0"
            withTooltip
          />
        )}
      </div>
    );
  }
);

export const EvmAssetIcon = memo<EvmAssetImageProps>(props => (
  <EvmAssetImage Loader={EvmAssetIconPlaceholder} Fallback={EvmAssetIconPlaceholder} {...props} />
));

const EvmAssetIconPlaceholder: EvmAssetImageProps['Fallback'] = memo(({ metadata, size, className, style }) =>
  metadata && isEvmCollectibleMetadata(metadata) ? (
    <CollectiblePlaceholderSvg className={className} style={style} width={size} height={size} />
  ) : (
    <IdenticonInitials
      value={getAssetSymbol(metadata)}
      className={className}
      style={style}
      width={size}
      height={size}
    />
  )
);

export const EvmAssetIconWithNetwork = memo<EvmAssetImageProps>(
  ({ assetSlug, evmChainId, className, style, ...props }) => {
    const network = useEvmChainByChainId(evmChainId);
    const metadata = useEvmGenericAssetMetadata(assetSlug, evmChainId);

    return (
      <div
        className={clsx('flex items-center justify-center relative', className)}
        style={{ width: ICON_DEFAULT_SIZE, height: ICON_DEFAULT_SIZE, ...style }}
      >
        <EvmAssetIcon
          assetSlug={assetSlug}
          evmChainId={evmChainId}
          size={isEvmCollectible(metadata) ? COLLECTIBLE_IMAGE_DEFAULT_SIZE : TOKEN_IMAGE_DEFAULT_SIZE}
          className={isEvmCollectible(metadata) ? 'rounded-8' : 'rounded-full'}
          {...props}
        />

        {network && (
          <EvmNetworkLogo
            chainId={network.chainId}
            size={NETWORK_IMAGE_DEFAULT_SIZE}
            className="absolute bottom-0 right-0"
            withTooltip
          />
        )}
      </div>
    );
  }
);
