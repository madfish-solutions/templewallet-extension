import React, { FC, useState } from 'react';

import Identicon from 'app/atoms/Identicon';
import { ReactComponent as CollectiblePlaceholder } from 'app/icons/collectible-placeholder.svg';
import { formatCollectibleUri, formatIpfsUri, formatTokenUri } from 'lib/image-uri';
import { AssetMetadata, getAssetSymbol, useAssetMetadata } from 'lib/temple/front';

interface AssetIconPlaceholderProps {
  metadata: AssetMetadata | null;
  size?: number;
}

const AssetIconPlaceholder: FC<AssetIconPlaceholderProps> = ({ metadata, size }) => {
  const isCollectible = Boolean(metadata?.artifactUri);

  return isCollectible ? (
    <CollectiblePlaceholder style={{ width: '100%', height: '100%' }} />
  ) : (
    <Identicon type="initials" hash={getAssetSymbol(metadata)} size={size} />
  );
};

interface AssetIconProps {
  assetSlug: string;
  className?: string;
  size?: number;
}

export const AssetIcon: FC<AssetIconProps> = ({ assetSlug, className, size }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingFailed, setIsLoadingFailed] = useState(false);
  const metadata: AssetMetadata | null = useAssetMetadata(assetSlug);
  const isCollectible = Boolean(metadata?.artifactUri);

  const imageSrc = isLoadingFailed
    ? formatIpfsUri(metadata?.thumbnailUri)
    : isCollectible
    ? formatCollectibleUri(assetSlug)
    : formatTokenUri(metadata?.thumbnailUri);

  return (
    <div className={className}>
      {imageSrc !== '' && (
        <img
          src={imageSrc}
          alt={metadata?.name}
          style={!isLoaded ? { display: 'none' } : {}}
          height={size}
          width={size}
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoadingFailed(true)}
        />
      )}
      {(!isLoaded || !metadata || imageSrc === '') && <AssetIconPlaceholder metadata={metadata} size={size} />}
    </div>
  );
};
