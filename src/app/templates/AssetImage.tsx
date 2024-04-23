import React, { FC, useMemo } from 'react';

import { buildTokenImagesStack, buildCollectibleImagesStack } from 'lib/images-uri';
import { AssetMetadataBase, isCollectibleTokenMetadata } from 'lib/metadata';
import { ImageStacked, ImageStackedProps } from 'lib/ui/ImageStacked';

export interface AssetImageProps
  extends Pick<ImageStackedProps, 'loader' | 'fallback' | 'className' | 'style' | 'onStackLoaded' | 'onStackFailed'> {
  metadata?: AssetMetadataBase;
  size?: number;
  fullViewCollectible?: boolean;
  evm?: boolean;
}

export const AssetImage: FC<AssetImageProps> = ({
  evm = false,
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
    if (evm) {
      return metadata?.thumbnailUri ? [metadata?.thumbnailUri] : [];
    }

    if (metadata && isCollectibleTokenMetadata(metadata))
      return buildCollectibleImagesStack(metadata, fullViewCollectible);

    return buildTokenImagesStack(metadata?.thumbnailUri);
  }, [evm, metadata, fullViewCollectible]);

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
