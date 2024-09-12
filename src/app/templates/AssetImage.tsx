import React, { FC, useMemo } from 'react';

import { buildTokenImagesStack, buildCollectibleImagesStack, buildEvmTokenIconSources } from 'lib/images-uri';
import { AssetMetadataBase, isCollectibleTokenMetadata } from 'lib/metadata';
import { EvmAssetMetadataBase } from 'lib/metadata/types';
import { ImageStacked, ImageStackedProps } from 'lib/ui/ImageStacked';

export interface AssetImageBaseProps
  extends Pick<
    ImageStackedProps,
    'loader' | 'fallback' | 'className' | 'style' | 'onStackLoaded' | 'onStackFailed' | 'alt'
  > {
  sources: string[];
  size?: number;
}

const AssetImageBase: FC<AssetImageBaseProps> = ({
  sources,
  className,
  size,
  style,
  alt,
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
      alt={alt}
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
  extraSrc?: string;
}

export const TezosAssetImage: FC<TezosAssetImageProps> = ({ metadata, fullViewCollectible, extraSrc, ...rest }) => {
  const sources = useMemo(() => {
    const sources =
      metadata && isCollectibleTokenMetadata(metadata)
        ? buildCollectibleImagesStack(metadata, fullViewCollectible)
        : buildTokenImagesStack(metadata?.thumbnailUri);

    if (extraSrc) sources.push(extraSrc);

    return sources;
  }, [metadata, fullViewCollectible, extraSrc]);

  return <AssetImageBase sources={sources} alt={metadata?.name} {...rest} />;
};

interface EvmAssetImageProps extends Omit<AssetImageBaseProps, 'sources'> {
  metadata?: EvmAssetMetadataBase;
  evmChainId: number;
  extraSrc?: string;
}

export const EvmAssetImage: FC<EvmAssetImageProps> = ({ evmChainId, metadata, extraSrc, ...rest }) => {
  const sources = useMemo(() => {
    const sources = metadata ? buildEvmTokenIconSources(metadata, evmChainId) : [];
    if (extraSrc) sources.push(extraSrc);

    return sources;
  }, [evmChainId, metadata, extraSrc]);

  return <AssetImageBase sources={sources} alt={metadata?.name} {...rest} />;
};
