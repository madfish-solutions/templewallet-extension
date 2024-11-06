import React, { FC, useMemo } from 'react';

import {
  buildTokenImagesStack,
  buildCollectibleImagesStack,
  buildEvmTokenIconSources,
  buildEvmCollectibleIconSources
} from 'lib/images-uri';
import { AssetMetadataBase, isCollectibleTokenMetadata } from 'lib/metadata';
import { EvmAssetMetadata, EvmAssetMetadataBase } from 'lib/metadata/types';
import { isEvmCollectible } from 'lib/metadata/utils';
import { ImageStacked, ImageStackedProps } from 'lib/ui/ImageStacked';

export interface AssetImageBaseProps
  extends Pick<ImageStackedProps, 'loader' | 'fallback' | 'className' | 'style' | 'onStackLoaded' | 'onStackFailed'> {
  sources: string[];
  metadata?: EvmAssetMetadataBase | AssetMetadataBase;
  size?: number;
}

const AssetImageBase: FC<AssetImageBaseProps> = ({
  sources,
  metadata,
  className,
  size,
  style,
  loader,
  fallback,
  onStackLoaded,
  onStackFailed
}) => {
  const styleMemo: React.CSSProperties = useMemo(
    () => ({
      objectFit: 'contain',
      maxWidth: '100%',
      maxHeight: '100%',
      ...style
    }),
    [style]
  );

  return (
    <ImageStacked
      sources={sources}
      loader={loader}
      fallback={fallback}
      alt={metadata?.name}
      className={className}
      style={styleMemo}
      height={size}
      width={size}
      onStackLoaded={onStackLoaded}
      onStackFailed={onStackFailed}
    />
  );
};

interface TezosAssetImageProps extends Omit<AssetImageBaseProps, 'sources'> {
  metadata?: AssetMetadataBase;
  fullViewCollectible?: boolean;
}

export const TezosAssetImage: FC<TezosAssetImageProps> = ({ metadata, fullViewCollectible, ...rest }) => {
  const sources = useMemo(() => {
    if (metadata && isCollectibleTokenMetadata(metadata))
      return buildCollectibleImagesStack(metadata, fullViewCollectible);

    return buildTokenImagesStack(metadata?.thumbnailUri);
  }, [metadata, fullViewCollectible]);

  return <AssetImageBase sources={sources} metadata={metadata} {...rest} />;
};

interface EvmAssetImageProps extends Omit<AssetImageBaseProps, 'sources'> {
  metadata?: EvmAssetMetadata;
  evmChainId?: number;
}

export const EvmAssetImage: FC<EvmAssetImageProps> = ({ evmChainId, metadata, ...rest }) => {
  const sources = useMemo(() => {
    if (!metadata) {
      return [];
    }

    if (isEvmCollectible(metadata) && metadata.image) {
      return buildEvmCollectibleIconSources(metadata);
    }

    return buildEvmTokenIconSources(metadata, evmChainId);
  }, [evmChainId, metadata]);

  return <AssetImageBase sources={sources} metadata={metadata} {...rest} />;
};
