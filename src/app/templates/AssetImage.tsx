import React, { FC, useMemo } from 'react';

import { buildTokenImagesStack, buildCollectibleImagesStack, buildEvmTokenIconSources } from 'lib/images-uri';
import { AssetMetadataBase, isCollectibleTokenMetadata } from 'lib/metadata';
import { EvmTokenMetadata } from 'lib/metadata/types';
import { ImageStacked, ImageStackedProps } from 'lib/ui/ImageStacked';

export interface AssetImageBaseProps
  extends Pick<ImageStackedProps, 'loader' | 'fallback' | 'className' | 'style' | 'onStackLoaded' | 'onStackFailed'> {
  sources: string[];
  metadata?: EvmTokenMetadata | AssetMetadataBase;
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
  metadata?: EvmTokenMetadata;
  evmChainId?: number;
}

export const EvmAssetImage: FC<EvmAssetImageProps> = ({ evmChainId, metadata, ...rest }) => {
  const sources = useMemo(
    () => (metadata ? buildEvmTokenIconSources(metadata, evmChainId) : []),
    [evmChainId, metadata]
  );

  return <AssetImageBase sources={sources} metadata={metadata} {...rest} />;
};
