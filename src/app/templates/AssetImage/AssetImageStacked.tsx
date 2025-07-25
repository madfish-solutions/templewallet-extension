import React, { FC } from 'react';

import {
  buildTokenImagesStack,
  buildCollectibleImagesStack,
  buildEvmTokenIconSources,
  buildEvmCollectibleIconSources
} from 'lib/images-uri';
import { AssetMetadataBase, isTezosCollectibleMetadata } from 'lib/metadata';
import { EvmAssetMetadataBase } from 'lib/metadata/types';
import { isEvmCollectibleMetadata } from 'lib/metadata/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { ImageStacked, ImageStackedProps } from 'lib/ui/ImageStacked';
import { areStringArraysEqual } from 'lib/utils/are-string-arrays-equal';

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
  const sources = useMemoWithCompare(
    () => {
      const sources =
        metadata && isTezosCollectibleMetadata(metadata)
          ? buildCollectibleImagesStack(metadata, fullViewCollectible)
          : buildTokenImagesStack(metadata?.thumbnailUri);

      if (extraSrc) sources.push(extraSrc);

      return sources;
    },
    [metadata, fullViewCollectible, extraSrc],
    areStringArraysEqual
  );

  return <ImageStacked sources={sources} alt={metadata?.name} {...rest} />;
};

export interface EvmAssetImageStackedProps extends AssetImageStackedPropsBase {
  metadata?: EvmAssetMetadataBase;
  evmChainId: number;
}

export const EvmAssetImageStacked: FC<EvmAssetImageStackedProps> = ({ evmChainId, metadata, extraSrc, ...rest }) => {
  const sources = useMemoWithCompare(
    () => {
      if (!metadata) return extraSrc ? [extraSrc] : [];

      if (isEvmCollectibleMetadata(metadata)) {
        const baseSources = buildEvmCollectibleIconSources(metadata);
        return extraSrc ? [...baseSources, extraSrc] : baseSources;
      }
      if (extraSrc) return [extraSrc];

      return buildEvmTokenIconSources(metadata, evmChainId);
    },
    [evmChainId, metadata, extraSrc],
    areStringArraysEqual
  );

  return <ImageStacked sources={sources} alt={metadata?.name} {...rest} />;
};
