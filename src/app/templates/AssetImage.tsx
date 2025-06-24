import React, { FC, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { buildTokenImagesStack, buildCollectibleImagesStack } from 'lib/images-uri';
import { AssetMetadataBase, isCollectibleTokenMetadata } from 'lib/metadata';
import { ImageStacked, ImageStackedProps } from 'lib/ui/ImageStacked';

export interface AssetImageProps
  extends Pick<ImageStackedProps, 'loader' | 'fallback' | 'className' | 'style' | 'onStackLoaded' | 'onStackFailed'> {
  metadata?: AssetMetadataBase;
  extraSrc?: string;
  size?: number;
  fullViewCollectible?: boolean;
}

export const AssetImage: FC<AssetImageProps> = ({
  metadata,
  extraSrc,
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
    if (isDefined(metadata) && isCollectibleTokenMetadata(metadata)) {
      const baseSources = buildCollectibleImagesStack(metadata, fullViewCollectible);
      if (extraSrc !== undefined) {
        baseSources.push(extraSrc);
      }

      return baseSources;
    }
    return buildTokenImagesStack(metadata?.thumbnailUri);
  }, [metadata, fullViewCollectible, extraSrc]);

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
