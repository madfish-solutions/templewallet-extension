import React, { FC, memo, useMemo } from 'react';

import classNames from 'clsx';

import Identicon from 'app/atoms/Identicon';
import { ReactComponent as CollectiblePlaceholder } from 'app/icons/collectible-placeholder.svg';
import { AssetMetadataBase, getAssetSymbol, isCollectible, useAssetMetadata } from 'lib/metadata';
import { buildTokenIconURLs, buildCollectibleImageURLs } from 'lib/temple/front';
import { Image } from 'lib/ui/Image';

interface PlaceholderProps {
  metadata: AssetMetadataBase | nullish;
  size?: number;
}

const AssetIconPlaceholder: FC<PlaceholderProps> = ({ metadata, size }) => {
  return metadata && isCollectible(metadata) ? (
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

  const src = useMemo(() => {
    if (metadata && isCollectible(metadata)) return buildCollectibleImageURLs(assetSlug, metadata, size == null);
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
