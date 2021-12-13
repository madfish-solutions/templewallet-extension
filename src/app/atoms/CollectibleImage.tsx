import React, { FC, useState } from 'react';

import { formatCollectibleUri } from 'lib/image-uri';
import { useRetryableSWR } from 'lib/swr';
import { fromAssetSlug } from 'lib/temple/assets';
import { useTezos } from 'lib/temple/front';
import { AssetMetadata } from 'lib/temple/metadata';

interface Props {
  collectibleMetadata: AssetMetadata;
  Placeholder: React.FunctionComponent<any>;
  className?: string;
  assetSlug: string;
}

const CollectibleImage: FC<Props> = ({ collectibleMetadata, assetSlug, Placeholder, className }) => {
  const tezos = useTezos();
  const [isLoaded, setIsLoaded] = useState(false);
  const asset = useRetryableSWR(['asset', assetSlug, tezos.checksum], () => fromAssetSlug(tezos, assetSlug), {
    suspense: true
  }).data!;
  if (asset === 'tez') return null;
  const assetId = asset.id ? asset.id.toString() : '0';
  const srcSlug = formatCollectibleUri(asset.contract, assetId);
  return (
    <>
      <img
        onLoad={() => setIsLoaded(true)}
        alt={collectibleMetadata.name}
        style={!isLoaded ? { display: 'none' } : {}}
        className={className}
        src={srcSlug}
      />
      {!isLoaded && <Placeholder style={{ display: 'inline' }} />}
    </>
  );
};

export default CollectibleImage;
