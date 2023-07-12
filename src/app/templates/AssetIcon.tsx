import React, { FC, memo } from 'react';

import clsx from 'clsx';

import Identicon from 'app/atoms/Identicon';
import { ReactComponent as CollectiblePlaceholder } from 'app/icons/collectible-placeholder.svg';
import { AssetMetadataBase, getAssetSymbol, isCollectible, useAssetMetadata } from 'lib/metadata';

import { AssetImage, AssetImageProps } from './AssetImage';

type Props = Omit<AssetImageProps, 'metadata' | 'loader' | 'fallback'>;

export const AssetIcon: FC<Props> = memo<Props>(({ className, style, ...props }) => {
  const metadata = useAssetMetadata(props.assetSlug);

  return (
    <div className={clsx('flex items-center justify-center', className)} style={style}>
      <AssetImage
        {...props}
        metadata={metadata}
        loader={<AssetIconPlaceholder metadata={metadata} size={props.size} />}
        fallback={<AssetIconPlaceholder metadata={metadata} size={props.size} />}
      />
    </div>
  );
});

interface PlaceholderProps {
  metadata: AssetMetadataBase | nullish;
  size?: number;
}

const AssetIconPlaceholder: FC<PlaceholderProps> = ({ metadata, size }) => {
  return metadata && isCollectible(metadata) ? (
    <CollectiblePlaceholder style={{ maxWidth: `${size}px`, width: '100%', height: '100%' }} />
  ) : (
    <Identicon type="initials" hash={getAssetSymbol(metadata)} size={size} />
  );
};
