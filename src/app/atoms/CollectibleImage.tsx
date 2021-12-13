import React, { FC, useState } from 'react';

import { formatCollectibleUri, formatImgUri, sanitizeImgUri } from 'lib/image-uri';
import { useRetryableSWR } from 'lib/swr';
import { fromAssetSlug } from 'lib/temple/assets';
import { useNetwork, useTezos } from 'lib/temple/front';
import { AssetMetadata } from 'lib/temple/metadata';

interface Props {
  collectibleMetadata: AssetMetadata;
  Placeholder: React.FunctionComponent<any>;
  className?: string;
  assetSlug: string;
}

const CollectibleImage: FC<Props> = ({ collectibleMetadata, assetSlug, Placeholder, className }) => {
  const tezos = useTezos();
  const network = useNetwork();
  const [isLoaded, setIsLoaded] = useState(false);
  const asset = useRetryableSWR(['asset', assetSlug, tezos.checksum], () => fromAssetSlug(tezos, assetSlug), {
    suspense: true
  }).data!;
  if (asset === 'tez') return null;
  const assetId = asset.id ? asset.id.toString() : '0';
  const objktSrc = formatCollectibleUri(asset.contract, assetId);
  const templeSrc = sanitizeImgUri(
    formatImgUri(collectibleMetadata.displayUri || collectibleMetadata.artifactUri!),
    512,
    512
  );
  const assetSrc = network.type === 'main' ? objktSrc : templeSrc;
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
