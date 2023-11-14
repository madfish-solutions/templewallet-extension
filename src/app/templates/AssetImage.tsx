import React, { FC, useMemo } from 'react';

import { buildTokenImagesStack, buildCollectibleImagesStack } from 'lib/images-uri';
import { AssetMetadataBase, isCollectibleTokenMetadata } from 'lib/metadata';
import { Image, ImageProps } from 'lib/ui/Image';

export interface AssetImageProps
  extends Pick<ImageProps, 'loader' | 'fallback' | 'lazy' | 'style' | 'onLoaded' | 'onError'> {
  metadata?: AssetMetadataBase;
  className?: string;
  size?: number;
  fullViewCollectible?: boolean;
}

export const AssetImage: FC<AssetImageProps> = ({
  metadata,
  className,
  size,
  fullViewCollectible,
  style,
  loader,
  fallback,
  lazy,
  onLoaded,
  onError
}) => {
  const sources = useMemo(() => {
    if (metadata && isCollectibleTokenMetadata(metadata))
      return buildCollectibleImagesStack(metadata, fullViewCollectible);

    return buildTokenImagesStack(metadata?.thumbnailUri);
  }, [metadata, fullViewCollectible]);

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
    <Image
      sources={sources}
      lazy={lazy}
      loader={loader}
      fallback={fallback}
      alt={metadata?.name}
      className={className}
      style={styleMemo}
      height={size}
      width={size}
      onLoaded={onLoaded}
      onError={onError}
    />
  );
};
