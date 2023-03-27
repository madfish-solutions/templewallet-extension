import React, { FC, memo, useMemo } from 'react';

import classNames from 'clsx';

import Identicon from 'app/atoms/Identicon';
import { ReactComponent as CollectiblePlaceholder } from 'app/icons/collectible-placeholder.svg';
import { useAssetMetadata, buildTokenIconURLs, buildCollectibleImageURLs } from 'lib/temple/front';
import { AssetMetadata, getAssetSymbol } from 'lib/temple/metadata';
import { Image } from 'lib/ui/Image';

interface PlaceholderProps {
  metadata: AssetMetadata | null;
  size?: number;
}

const AssetIconPlaceholder: FC<PlaceholderProps> = ({ metadata, size }) => {
  const isCollectible = Boolean(metadata?.artifactUri);

  return isCollectible ? (
    <CollectiblePlaceholder style={{ maxWidth: `${size}px`, width: '100%', height: '100%' }} />
  ) : (
    <Identicon type="initials" hash={getAssetSymbol(metadata)} size={size} />
  );
};

interface Props {
  assetSlug: string;
  className?: string;
  size?: number;
}

export const AssetIcon: FC<Props> = memo<Props>(({ assetSlug, className, size }) => {
  const metadata = useAssetMetadata(assetSlug);

  const isCollectible = Boolean(metadata?.artifactUri);

  const src = useMemo(() => {
    if (isCollectible) return buildCollectibleImageURLs(assetSlug, metadata, size == null);
    else return buildTokenIconURLs(metadata?.thumbnailUri, size == null);
  }, [metadata, assetSlug]);

  return (
    <div className={classNames('flex items-center justify-center', className)}>
      <Image
        src={src}
        loader={<AssetIconPlaceholder metadata={metadata} size={size} />}
        fallback={<AssetIconPlaceholder metadata={metadata} size={size} />}
        alt={metadata?.name}
        style={{
          objectFit: 'contain',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
        height={size}
        width={size}
      />
    </div>
  );
});
