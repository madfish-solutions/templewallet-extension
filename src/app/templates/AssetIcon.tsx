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
  uri: (value: string) => string;
  field: 'thumbnailUri' | 'artifactUri' | 'displayUri' | 'assetSlug';
}

const tokenLoadStrategy: Array<LoadStrategy> = [
  { type: 'token', uri: formatTokenUri, field: 'thumbnailUri' },
  { type: 'thumbnailUri', uri: formatIpfsUri, field: 'thumbnailUri' }
];
const collectibleLoadStrategy: Array<LoadStrategy> = [
  { type: 'objkt', uri: formatCollectibleUri, field: 'assetSlug' },
  { type: 'displayUri', uri: formatIpfsUri, field: 'displayUri' },
  { type: 'artifactUri', uri: formatIpfsUri, field: 'artifactUri' },
  { type: 'thumbnailUri', uri: formatIpfsUri, field: 'thumbnailUri' }
];

const getFirstFallback = (
  strategy: Array<LoadStrategy>,
  currentState: Record<string, boolean>,
  metadata: AssetMetadata | null
): LoadStrategy => {
  for (const strategyItem of strategy) {
    // @ts-ignore
    if (metadata && metadata[strategyItem.type] && !currentState[strategyItem.type]) {
      return strategyItem;
    }
  }
  return strategy[0];
};

export const AssetIcon: FC<AssetIconProps> = ({ assetSlug, className, size }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const metadata: AssetMetadata | null = useAssetMetadata(assetSlug);
  const isCollectible = Boolean(metadata?.artifactUri);
  const loadStrategy = isCollectible ? collectibleLoadStrategy : tokenLoadStrategy;
  const [isLoadingFailed, setIsLoadingFailed] = useState(
    loadStrategy.reduce<Record<string, boolean>>((acc, cur) => ({ ...acc, [cur.type]: false }), {})
  );

  const imageRequestObject = { ...metadata, assetSlug };
  const currentFallback = getFirstFallback(loadStrategy, isLoadingFailed, metadata);
  const imageSrc = currentFallback.uri(imageRequestObject[currentFallback.field] ?? assetSlug);

  const handleLoadingFailed = () => {
    setIsLoadingFailed(prevState => ({ ...prevState, [currentFallback.type]: true }));
  };

  return (
    <div className={className}>
      {imageSrc !== '' && (
        <img
          src={imageSrc}
          alt={metadata?.name}
          style={{
            ...(!isLoaded ? { display: 'none' } : {}),
            objectFit: 'contain',
            maxWidth: `${size}px`,
            maxHeight: `${size}px`
          }}
          height={size}
          width={size}
          onLoad={() => setIsLoaded(true)}
          onError={handleLoadingFailed}
        />
      )}
      {(!isLoaded || !metadata || imageSrc === '') && <AssetIconPlaceholder metadata={metadata} size={size} />}
    </div>
  );
};
