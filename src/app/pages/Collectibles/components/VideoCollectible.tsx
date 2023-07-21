import React, { FC, useState } from 'react';

import { emptyFn } from 'app/utils/function.utils';

import { formatCollectibleObjktArtifactUri } from '../utils/image.utils';

interface Props {
  uri: string;
  loader?: React.ReactElement;
  onError?: EmptyFn;
}
export const VideoCollectible: FC<Props> = ({ uri, loader, onError = emptyFn }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <video autoPlay loop onLoad={() => setIsLoading(false)} onError={onError}>
      <source src={formatCollectibleObjktArtifactUri(uri)} type="video/mp4" />
      {isLoading && loader}
    </video>
  );
};
