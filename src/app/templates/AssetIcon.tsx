import React, { FC, useState } from 'react';

import classNames from 'clsx';

import Identicon from 'app/atoms/Identicon';
import { ReactComponent as CollectiblePlaceholder } from 'app/icons/collectible-placeholder.svg';
import { formatObjktSmallAssetUri, formatAssetUri } from 'lib/image-uri';
import { useAssetMetadata } from 'lib/temple/front';
import { AssetMetadata, getAssetSymbol } from 'lib/temple/metadata';

interface AssetIconPlaceholderProps {
  metadata: AssetMetadata | null;
  size?: number;
}

const AssetIconPlaceholder: FC<AssetIconPlaceholderProps> = ({ metadata, size }) => {
  const isCollectible = Boolean(metadata?.artifactUri);

  return isCollectible ? (
    <CollectiblePlaceholder style={{ maxWidth: `${size}px`, width: '100%', height: '100%' }} />
  ) : (
    <Identicon type="initials" hash={getAssetSymbol(metadata)} size={size} />
  );
};

interface AssetIconProps {
  assetSlug: string;
  className?: string;
  size?: number;
}

interface LoadStrategy {
  type: string;
  formatUriFn: (value: string) => string;
  field: 'thumbnailUri' | 'artifactUri' | 'displayUri' | 'assetSlug';
}

const tokenLoadStrategy: Array<LoadStrategy> = [
  { type: 'thumbnailUri', formatUriFn: formatAssetUri, field: 'thumbnailUri' }
];
const collectibleLoadStrategy: Array<LoadStrategy> = [
  { type: 'objktSmall', formatUriFn: formatObjktSmallAssetUri, field: 'assetSlug' },
  { type: 'displayUri', formatUriFn: formatAssetUri, field: 'displayUri' },
  { type: 'artifactUri', formatUriFn: formatAssetUri, field: 'artifactUri' },
  { type: 'thumbnailUri', formatUriFn: formatAssetUri, field: 'thumbnailUri' }
];

type ImageRequestObject = (AssetMetadata | null) & { assetSlug: string };

const getFirstFallback = (
  strategy: Array<LoadStrategy>,
  currentState: Record<string, boolean>,
  metadata: ImageRequestObject
): LoadStrategy => {
  for (const strategyItem of strategy) {
    if (metadata && metadata[strategyItem.field] && !currentState[strategyItem.type]) {
      return strategyItem;
    }
  }
  return strategy[0];
};

export const AssetIcon: FC<AssetIconProps> = ({ assetSlug, className, size }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const metadata = useAssetMetadata(assetSlug)!;
  const isCollectible = Boolean(metadata?.artifactUri);
  const loadStrategy = isCollectible ? collectibleLoadStrategy : tokenLoadStrategy;
  const [isLoadingFailed, setIsLoadingFailed] = useState(
    loadStrategy.reduce<Record<string, boolean>>((acc, cur) => ({ ...acc, [cur.type]: false }), {})
  );

  const imageRequestObject: ImageRequestObject = { ...metadata, assetSlug };
  const currentFallback = getFirstFallback(loadStrategy, isLoadingFailed, imageRequestObject);
  const imageSrc = currentFallback.formatUriFn(imageRequestObject[currentFallback.field] ?? assetSlug);

  const handleLoad = () => setIsLoaded(true);
  const handleError = () => setIsLoadingFailed(prevState => ({ ...prevState, [currentFallback.type]: true }));

  return (
    <div className={classNames('flex items-center justify-center', className)}>
      {imageSrc !== '' && (
        <img
          src={imageSrc}
          alt={metadata?.name}
          style={{
            ...(!isLoaded ? { display: 'none' } : {}),
            objectFit: 'contain',
            maxWidth: `100%`,
            maxHeight: `100%`
          }}
          height={size}
          width={size}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      {(!isLoaded || !metadata || imageSrc === '') && <AssetIconPlaceholder metadata={metadata} size={size} />}
    </div>
  );
};
