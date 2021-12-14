import React, { FC, useState } from 'react';

import { AssetMetadata } from 'lib/temple/metadata';
import useImageLoader from 'lib/ui/useImageLoader';

interface Props {
  collectibleMetadata: AssetMetadata;
  Placeholder: React.FunctionComponent<any>;
  className?: string;
  assetSlug: string;
}

const CollectibleImage: FC<Props> = ({ collectibleMetadata, assetSlug, Placeholder, className }) => {
  const assetSrc = useImageLoader(assetSlug);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      <img
        onLoad={() => setIsLoaded(true)}
        alt={collectibleMetadata.name}
        style={!isLoaded ? { display: 'none' } : {}}
        className={className}
        src={assetSrc}
      />
      {!isLoaded && <Placeholder style={{ display: 'inline' }} />}
    </>
  );
};

export default CollectibleImage;
