import React, { memo, useMemo } from 'react';

import { AssetMetadataBase, isCollectible } from 'lib/metadata';
import { buildTokenIconURLs, buildCollectibleImageURLs } from 'lib/temple/front';
import { Image, ImageProps } from 'lib/ui/Image';

export interface AssetImageProps extends Pick<ImageProps, 'loader' | 'fallback' | 'onLoad'> {
  assetSlug: string;
  metadata?: AssetMetadataBase;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export const AssetImage = memo<AssetImageProps>(
  ({ metadata, assetSlug, className, size, style, loader, fallback, onLoad }) => {
    const src = useMemo(() => {
      if (metadata && isCollectible(metadata)) return buildCollectibleImageURLs(assetSlug, metadata, size == null);
      else return buildTokenIconURLs(metadata?.thumbnailUri, size == null);
    }, [metadata, assetSlug, size]);

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
        src={src}
        loader={loader}
        fallback={fallback}
        alt={metadata?.name}
        className={className}
        style={styleMemo}
        height={size}
        width={size}
        onLoad={onLoad}
      />
    );
  }
);
