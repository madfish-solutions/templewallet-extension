import React, { FC, useMemo } from 'react';

import { buildTokenImagesStack, buildCollectibleImagesStack, getEvmCustomChainIconUrl } from 'lib/images-uri';
import { AssetMetadataBase, isCollectibleTokenMetadata } from 'lib/metadata';
import { EVMTokenMetadata } from 'lib/metadata/types';
import { ImageStacked, ImageStackedProps } from 'lib/ui/ImageStacked';

export interface AssetImageProps
  extends Pick<ImageStackedProps, 'loader' | 'fallback' | 'className' | 'style' | 'onStackLoaded' | 'onStackFailed'> {
  metadata?: AssetMetadataBase;
  size?: number;
  fullViewCollectible?: boolean;
  evmChainId?: number;
}

export const AssetImage: FC<AssetImageProps> = ({
  evmChainId,
  metadata,
  className,
  size,
  fullViewCollectible,
  style,
  loader,
  fallback,
  onStackLoaded,
  onStackFailed
}) => {
  const sources = useMemo(() => {
    if (evmChainId) {
      return metadata?.thumbnailUri
        ? [getEvmCustomChainIconUrl(evmChainId, (metadata as EVMTokenMetadata).address), metadata?.thumbnailUri]
        : [];
    }

    if (metadata && isCollectibleTokenMetadata(metadata))
      return buildCollectibleImagesStack(metadata, fullViewCollectible);

    return buildTokenImagesStack(metadata?.thumbnailUri);
  }, [evmChainId, metadata, fullViewCollectible]);

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
