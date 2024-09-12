import React, { FC, useMemo } from 'react';

import {
  buildTokenImagesStack,
  buildCollectibleImagesStack,
  buildEvmTokenIconSources,
  buildEvmCollectibleIconSources
} from 'lib/images-uri';
import { AssetMetadataBase, isTezosCollectibleMetadata } from 'lib/metadata';
import { EvmAssetMetadataBase } from 'lib/metadata/types';
import { isEvmCollectibleMetadata } from 'lib/metadata/utils';
import { ImageStacked, ImageStackedProps } from 'lib/ui/ImageStacked';

export interface TezosAssetImageStackedProps extends Omit<AssetImageStackedProps, 'sources'> {
  metadata?: AssetMetadataBase;
  fullViewCollectible?: boolean;
  extraSrc?: string;
}

export const TezosAssetImageStacked: FC<TezosAssetImageStackedProps> = ({
  metadata,
  fullViewCollectible,
  extraSrc,
  ...rest
}) => {
  const sources = useMemo(() => {
    const sources =
      metadata && isTezosCollectibleMetadata(metadata)
        ? buildCollectibleImagesStack(metadata, fullViewCollectible)
        : buildTokenImagesStack(metadata?.thumbnailUri);

    if (extraSrc) sources.push(extraSrc);

    return sources;
  }, [metadata, fullViewCollectible, extraSrc]);

  return <AssetImageStacked sources={sources} alt={metadata?.name} {...rest} />;
};

export interface EvmAssetImageStackedProps extends Omit<AssetImageStackedProps, 'sources'> {
  metadata?: EvmAssetMetadataBase;
  evmChainId: number;
  extraSrc?: string;
}

export const EvmAssetImageStacked: FC<EvmAssetImageStackedProps> = ({ evmChainId, metadata, extraSrc, ...rest }) => {
  const sources = useMemo(() => {
    const sources = metadata
      ? isEvmCollectibleMetadata(metadata)
        ? buildEvmCollectibleIconSources(metadata)
        : buildEvmTokenIconSources(metadata, evmChainId)
      : [];

    if (extraSrc) sources.push(extraSrc);

    return sources;
  }, [evmChainId, metadata, extraSrc]);

  return <AssetImageStacked sources={sources} alt={metadata?.name} {...rest} />;
};

export interface AssetImageStackedProps
  extends Pick<
    ImageStackedProps,
    'loader' | 'fallback' | 'className' | 'style' | 'onStackLoaded' | 'onStackFailed' | 'alt'
  > {
  sources: string[];
  size?: number;
}

export const AssetImageStacked: FC<AssetImageStackedProps> = ({
  sources,
  className,
  size,
  style,
  alt,
  loader,
  fallback,
  onStackLoaded,
  onStackFailed,
  ...rest
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
      alt={alt}
      className={className}
      style={styleMemo}
      height={size}
      width={size}
      onStackLoaded={onStackLoaded}
      onStackFailed={onStackFailed}
      {...rest}
    />
  );
};
