import React, { FC, memo, useMemo } from 'react';

import { ReactComponent as CollectiblePlaceholderSvg } from 'app/icons/collectible-placeholder.svg';
import { AssetMetadataBase, isCollectible } from 'lib/metadata';
import { buildTokenIconURLs, buildCollectibleImageURLs } from 'lib/temple/front';
import { Image } from 'lib/ui/Image';

interface Props {
  assetSlug: string;
  metadata: AssetMetadataBase;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export const CollectibleItemImage: FC<Props> = memo<Props>(({ metadata, assetSlug, className, size, style }) => {
  const src = useMemo(() => {
    if (metadata && isCollectible(metadata)) return buildCollectibleImageURLs(assetSlug, metadata, size == null);
    else return buildTokenIconURLs(metadata?.thumbnailUri, size == null);
  }, [metadata, assetSlug]);

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
      loader={<ImagePlaceholder metadata={metadata} size={size} />}
      fallback={<ImagePlaceholder metadata={metadata} size={size} />}
      alt={metadata?.name}
      className={className}
      style={styleMemo}
      height={size}
      width={size}
    />
  );
});

interface PlaceholderProps {
  metadata: AssetMetadataBase | nullish;
  size?: number;
}

const ImagePlaceholder: FC<PlaceholderProps> = ({ size }) => {
  const styleMemo = useMemo(() => ({ maxWidth: `${size}px`, width: '100%', height: '100%' }), [size]);

  return <CollectiblePlaceholderSvg style={styleMemo} />;
};
