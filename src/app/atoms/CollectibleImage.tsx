import React, { FC, StyleHTMLAttributes, useState } from "react";

import { formatImgUri } from "lib/image-uri";
import { AssetMetadata } from "lib/temple/metadata/types";

interface Props {
  collectibleMetadata: AssetMetadata;
  Placeholder: React.FunctionComponent<any>;
  className?: string;
}

const CollectibleImage: FC<Props> = ({
  collectibleMetadata,
  Placeholder,
  className,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <>
      <img
        onLoad={() => setIsLoaded(true)}
        alt={collectibleMetadata.name}
        style={!isLoaded ? { display: "none" } : {}}
        className={className}
        src={formatImgUri(collectibleMetadata.artifactUri!)}
      />
      {!isLoaded && <Placeholder style={{display: 'inline'}} />}
    </>
  );
};

export default CollectibleImage;
