import React, { memo, useState } from 'react';

import classNames from 'clsx';

import Identicon from 'app/atoms/Identicon';
import { ReactComponent as PlaceholderSmall } from 'app/icons/collectiblePlaceholder.svg';
import { ReactComponent as PlaceholderLarge } from 'app/icons/collectiblePlaceholderLarge.svg';
import { getAssetSymbol, getThumbnailUri, useAssetMetadata } from 'lib/temple/front';

import { formatCollectibleUri } from '../../lib/image-uri';

interface AssetIconProps {
  assetSlug: string;
  className?: string;
  size?: number;
  placeholder?: 'small' | 'large';
}

const AssetIcon = memo((props: AssetIconProps) => {
  const { assetSlug, className, size, placeholder } = props;

  const metadata = useAssetMetadata(assetSlug);
  const isCollectible = Boolean(metadata.artifactUri);

  const [fallback, setFallback] = useState(false);
  const [display, setDisplay] = useState(true);

  let thumbnailUri;
  if (isCollectible && !fallback && assetSlug !== 'tez') {
    thumbnailUri = formatCollectibleUri(assetSlug);
  } else {
    thumbnailUri = getThumbnailUri(metadata);
  }

  const handleError = () => void (isCollectible ? setFallback(true) : setDisplay(false));

  if (thumbnailUri && display) {
    return (
      <img
        className={classNames(!isCollectible && 'overflow-hidden', className)}
        onError={handleError}
        alt={metadata.name}
        src={thumbnailUri}
        height={size}
        width={size}
      />
    );
  }

  return isCollectible ? (
    placeholder === 'large' ? (
      <PlaceholderLarge style={{ display: 'inline' }} />
    ) : (
      <PlaceholderSmall />
    )
  ) : (
    <Identicon type="initials" hash={getAssetSymbol(metadata)} className={className} size={size} />
  );
});

export default AssetIcon;
