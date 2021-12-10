import React, { FC, useState } from 'react';

import { formatCollectibleUri } from 'lib/image-uri';
import { AssetMetadata } from 'lib/temple/metadata';

interface Props {
  collectibleMetadata: AssetMetadata;
  Placeholder: React.FunctionComponent<any>;
  className?: string;
  assetSlug: string;
}

const CollectibleImage: FC<Props> = ({ collectibleMetadata, assetSlug, Placeholder, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [address, id] = assetSlug.split('_');
  return (
    <>
      <img
        onLoad={() => setIsLoaded(true)}
        alt={collectibleMetadata.name}
        style={!isLoaded ? { display: 'none' } : {}}
        className={className}
        src={formatCollectibleUri(address, id)}
      />
      {!isLoaded && <Placeholder style={{ display: 'inline' }} />}
    </>
  );
};

export default CollectibleImage;
