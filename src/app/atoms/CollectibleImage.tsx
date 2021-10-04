import React, { FC, useState } from "react";

import { formatImgUri, sanitizeImgUri } from "lib/image-uri";
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
        src={sanitizeImgUri(
          formatImgUri(collectibleMetadata.artifactUri!),
          512,
          512
        )}
      />
      {!isLoaded && <Placeholder style={{ display: "inline" }} />}
    </>
  );
};

export default CollectibleImage;
