import React, { CSSProperties, memo, useCallback, useState } from 'react';

import classNames from 'clsx';

import Identicon from 'app/atoms/Identicon';
import { formatCollectibleUri, formatImgUri, sanitizeImgUri } from 'lib/image-uri';
import { useRetryableSWR } from 'lib/swr';
import { AssetTypesEnum, fromAssetSlug } from 'lib/temple/assets';
import { useAssetMetadata, getAssetSymbol, getThumbnailUri, useNetwork, useTezos } from 'lib/temple/front';

export type AssetIconProps = {
  assetSlug: string;
  className?: string;
  style?: CSSProperties;
  size?: number;
  assetType: string;
};

const AssetIcon = memo((props: AssetIconProps) => {
  const { assetSlug, className, style, size, assetType } = props;
  const tezos = useTezos();
  const network = useNetwork();
  const collectibleMetadata = useAssetMetadata(assetSlug)!;
  const asset = useRetryableSWR(['asset', assetSlug, tezos.checksum], () => fromAssetSlug(tezos, assetSlug), {
    suspense: true
  }).data!;
  const metadata = useAssetMetadata(assetSlug);
  let thumbnailUri;
  if (assetType === AssetTypesEnum.Collectibles && asset !== 'tez') {
    const assetId = asset.id ? asset.id.toString() : '0';
    const objktSrc = formatCollectibleUri(asset.contract, assetId);
    const templeSrc = sanitizeImgUri(
      formatImgUri(collectibleMetadata.displayUri || collectibleMetadata.artifactUri!),
      512,
      512
    );
    thumbnailUri = network.type === 'main' ? objktSrc : templeSrc;
  } else {
    thumbnailUri = getThumbnailUri(metadata);
  }

  const [imageDisplayed, setImageDisplayed] = useState(true);
  const handleImageError = useCallback(() => {
    setImageDisplayed(false);
  }, [setImageDisplayed]);

  if (thumbnailUri && imageDisplayed) {
    return (
      <img
        src={thumbnailUri}
        alt={metadata?.name}
        className={classNames('overflow-hidden', className)}
        style={{
          width: size,
          height: size,
          ...style
        }}
        onError={handleImageError}
      />
    );
  }

  return <Identicon type="initials" hash={getAssetSymbol(metadata)} className={className} style={style} size={size} />;
});

export default AssetIcon;
