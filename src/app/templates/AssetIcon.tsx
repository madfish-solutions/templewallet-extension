import React, { memo, useState } from 'react';

import classNames from 'clsx';

import Identicon from 'app/atoms/Identicon';
import { ReactComponent as Placeholder } from 'app/icons/collectiblePlaceholderLarge.svg';
import { getAssetSymbol, getThumbnailUri, useAssetMetadata } from 'lib/temple/front';

import { formatCollectibleUri } from '../../lib/image-uri';

interface AssetIconProps {
  assetSlug: string;
  className?: string;
  size?: number;
}

const AssetIcon = memo((props: AssetIconProps) => {
  const { assetSlug, className, size } = props;

  const metadata = useAssetMetadata(assetSlug);
  const isCollectible = Boolean(metadata.artifactUri);
  const isTez = assetSlug === 'tez';

  const thumbnailUri = isTez
    ? getThumbnailUri(metadata)
    : isCollectible
    ? formatCollectibleUri(assetSlug)
    : getThumbnailUri(metadata);

  const [isLoaded, setIsLoaded] = useState(false);
  const [imageDisplayed, setImageDisplayed] = useState(true);
  const displayingError = !isLoaded || !imageDisplayed;

  if (thumbnailUri) {
    return (
      <img
        className={classNames(!isCollectible && 'overflow-hidden', className)}
        onError={() => setImageDisplayed(false)}
        onLoad={() => setIsLoaded(true)}
        alt={metadata.name}
        src={thumbnailUri}
        height={size}
        width={size}
      />
    );
  }

  return isCollectible ? (
    <Placeholder style={{ display: 'inline' }} />
  ) : (
    <Identicon type="initials" hash={getAssetSymbol(metadata)} className={className} size={size} />
  );
});

export default AssetIcon;
