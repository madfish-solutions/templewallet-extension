import React, { FC, memo } from 'react';

import clsx from 'clsx';

import Identicon from 'app/atoms/Identicon';
import { ReactComponent as CollectiblePlaceholder } from 'app/icons/collectible-placeholder.svg';
import { useEvmTokenMetadataSelector } from 'app/store/evm/tokens-metadata/selectors';
import { AssetMetadataBase, getAssetSymbol, isCollectible, useAssetMetadata } from 'lib/metadata';
import { EvmTokenMetadata } from 'lib/metadata/types';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { useEvmChainByChainId } from 'temple/front/chains';

import { AssetImage, AssetImageProps } from './AssetImage';

interface AssetIconProps extends Omit<AssetImageProps, 'metadata' | 'loader' | 'fallback'> {
  tezosChainId: string;
  assetSlug: string;
}

export const AssetIcon = memo<AssetIconProps>(({ tezosChainId, className, style, ...props }) => {
  const metadata = useAssetMetadata(props.assetSlug, tezosChainId);

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

interface EvmAssetIconProps extends Omit<AssetImageProps, 'metadata' | 'loader' | 'fallback'> {
  evmChainId: number;
  assetSlug: string;
}

export const EvmTokenIcon = memo<EvmAssetIconProps>(({ evmChainId, assetSlug, className, style, ...props }) => {
  const network = useEvmChainByChainId(evmChainId);
  const tokenMetadata = useEvmTokenMetadataSelector(evmChainId, assetSlug);

  const metadata = isEvmNativeTokenSlug(assetSlug) ? network?.currency : tokenMetadata;

  return (
    <div className={clsx('flex items-center justify-center', className)} style={style}>
      <AssetImage
        {...props}
        evmChainId={evmChainId}
        metadata={metadata}
        loader={<AssetIconPlaceholder metadata={metadata} size={props.size} />}
        fallback={<AssetIconPlaceholder metadata={metadata} size={props.size} />}
      />
    </div>
  );
});

interface PlaceholderProps {
  metadata: EvmTokenMetadata | AssetMetadataBase | nullish;
  size?: number;
}

const AssetIconPlaceholder: FC<PlaceholderProps> = ({ metadata, size }) => {
  return metadata && isCollectible(metadata) ? (
    <CollectiblePlaceholder style={{ maxWidth: `${size}px`, width: '100%', height: '100%' }} />
  ) : (
    <Identicon type="initials" hash={getAssetSymbol(metadata)} size={size} />
  );
};
