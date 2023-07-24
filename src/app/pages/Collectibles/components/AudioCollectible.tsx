import React, { FC, useCallback, useState } from 'react';

import { emptyFn } from 'app/utils/function.utils';

import { formatCollectibleObjktArtifactUri } from '../utils/image.utils';

interface Props {
  uri: string;
  loader?: React.ReactElement;
  onError?: EmptyFn;
}
export const AudioCollectible: FC<Props> = ({ uri, loader, onError = emptyFn }) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = useCallback(() => setIsLoading(false), []);

  return (
    <>
      <audio autoPlay loop src={formatCollectibleObjktArtifactUri(uri)} onLoadedData={handleLoad} onError={onError} />
      {isLoading && loader}
    </>
  );
};
