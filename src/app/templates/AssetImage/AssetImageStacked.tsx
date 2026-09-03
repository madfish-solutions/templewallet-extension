import { FC } from 'react';

import {
  buildCollectibleImagesStack,
  buildTokenImageSourceStages,
  buildEvmTokenIconSources,
  buildEvmCollectibleIconSources
} from 'lib/images-uri';
import { AssetMetadataBase, isTezosCollectibleMetadata } from 'lib/metadata';
import { EvmAssetMetadataBase } from 'lib/metadata/types';
import { isEvmCollectibleMetadata } from 'lib/metadata/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { ImageStacked, ImageStackedProps } from 'lib/ui/ImageStacked';
import { normalizeImageSources } from 'lib/ui/race-image-urls';

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
  const sources = useMemoWithCompare(() => {
    const stack =
      metadata && isTezosCollectibleMetadata(metadata)
        ? buildCollectibleImagesStack(metadata, fullViewCollectible)
        : buildTokenImageSourceStages(metadata?.thumbnailUri);

    if (!extraSrc) return stack;

    return normalizeImageSources(stack).concat({ urls: [extraSrc] });
  }, [metadata, fullViewCollectible, extraSrc]);

  return <ImageStacked sources={sources} alt={metadata?.name} {...rest} />;
};

export interface EvmAssetImageStackedProps extends AssetImageStackedPropsBase {
  metadata?: EvmAssetMetadataBase;
  evmChainId: number;
}

export const EvmAssetImageStacked: FC<EvmAssetImageStackedProps> = ({ evmChainId, metadata, extraSrc, ...rest }) => {
  const sources = useMemoWithCompare(() => {
    if (!metadata) return extraSrc ? [{ urls: [extraSrc] }] : [];

    if (isEvmCollectibleMetadata(metadata)) {
      const baseSources = buildEvmCollectibleIconSources(metadata);
      return extraSrc ? baseSources.concat({ urls: [extraSrc] }) : baseSources;
    }
    if (extraSrc) return [{ urls: [extraSrc] }];

    return buildEvmTokenIconSources(metadata, evmChainId);
  }, [evmChainId, metadata, extraSrc]);

  return <ImageStacked sources={sources} alt={metadata?.name} {...rest} />;
};
