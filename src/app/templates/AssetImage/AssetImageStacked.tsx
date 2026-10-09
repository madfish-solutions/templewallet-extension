import { FC } from 'react';

import {
  appendExtraSource,
  buildCollectibleImageSourceStages,
  buildTokenImageSourceStages,
  buildEvmTokenIconSources,
  buildEvmCollectibleIconSources
} from 'lib/images-uri';
import { AssetMetadataBase, isTezosCollectibleMetadata } from 'lib/metadata';
import { EvmAssetMetadataBase } from 'lib/metadata/types';
import { isEvmCollectibleMetadata } from 'lib/metadata/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { ImageStacked, ImageStackedProps } from 'lib/ui/ImageStacked';

interface AssetImageStackedPropsBase extends Omit<ImageStackedProps, 'pauseRender' | 'sources'> {
  extraSrc?: string;
}

export interface TezosAssetImageStackedProps extends AssetImageStackedPropsBase {
  metadata?: AssetMetadataBase;
  fullViewCollectible?: boolean;
}

export const TezosAssetImageStacked: FC<TezosAssetImageStackedProps> = ({
  metadata,
  fullViewCollectible,
  extraSrc,
  ...rest
}) => {
  const collectibleMetadata = metadata && isTezosCollectibleMetadata(metadata) ? metadata : undefined;

  const sources = useMemoWithCompare(() => {
    const stack = collectibleMetadata
      ? buildCollectibleImageSourceStages(collectibleMetadata, fullViewCollectible)
      : buildTokenImageSourceStages(metadata?.thumbnailUri);

    return appendExtraSource(stack, extraSrc);
  }, [collectibleMetadata, metadata, fullViewCollectible, extraSrc]);

  return <ImageStacked sources={sources} progressive={Boolean(collectibleMetadata)} alt={metadata?.name} {...rest} />;
};

export interface EvmAssetImageStackedProps extends AssetImageStackedPropsBase {
  metadata?: EvmAssetMetadataBase;
  evmChainId: number;
}

export const EvmAssetImageStacked: FC<EvmAssetImageStackedProps> = ({ evmChainId, metadata, extraSrc, ...rest }) => {
  const sources = useMemoWithCompare(() => {
    if (!metadata) return appendExtraSource([], extraSrc);

    if (isEvmCollectibleMetadata(metadata))
      return appendExtraSource(buildEvmCollectibleIconSources(metadata), extraSrc);
    if (extraSrc) return [{ urls: [extraSrc] }];

    return buildEvmTokenIconSources(metadata, evmChainId);
  }, [evmChainId, metadata, extraSrc]);

  return <ImageStacked sources={sources} alt={metadata?.name} {...rest} />;
};
