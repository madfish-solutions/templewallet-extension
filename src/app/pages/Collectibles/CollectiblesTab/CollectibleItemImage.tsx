import React, { memo, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { debounce } from 'lodash';

import { useCollectibleIsAdultSelector } from 'app/store/collectibles/selectors';
import { buildCollectibleImagesStack } from 'lib/images-uri';
import type { TokenMetadata } from 'lib/metadata';
import { ImageStacked } from 'lib/ui/ImageStacked';
import { useIntersectionDetection } from 'lib/ui/use-intersection-detection';

import { CollectibleBlur } from '../components/CollectibleBlur';
import { CollectibleImageFallback } from '../components/CollectibleImageFallback';
import { CollectibleImageLoader } from '../components/CollectibleImageLoader';

interface Props {
  assetSlug: string;
  metadata?: TokenMetadata;
  adultBlur: boolean;
  areDetailsLoading: boolean;
  mime?: string | null;
  containerElemRef: React.RefObject<Element>;
}

export const CollectibleItemImage = memo<Props>(
  ({ assetSlug, metadata, adultBlur, areDetailsLoading, mime, containerElemRef }) => {
    const isAdultContent = useCollectibleIsAdultSelector(assetSlug);
    const isAdultFlagLoading = areDetailsLoading && !isDefined(isAdultContent);
    const shouldShowBlur = isAdultContent && adultBlur;

    const sources = useMemo(() => (metadata ? buildCollectibleImagesStack(metadata) : []), [metadata]);

    const isAudioCollectible = useMemo(() => Boolean(mime && mime.startsWith('audio')), [mime]);

    const [isInViewport, setIsInViewport] = useState(false);
    const handleIntersection = useMemo(() => debounce(setIsInViewport, 500), []);

    useIntersectionDetection(containerElemRef, handleIntersection, true, 800);

    return (
      <div className={isInViewport ? 'contents' : 'hidden'}>
        {isAdultFlagLoading ? (
          <CollectibleImageLoader />
        ) : shouldShowBlur ? (
          <CollectibleBlur />
        ) : (
          <ImageStacked
            sources={sources}
            loading="lazy"
            className="max-w-full max-h-full object-contain"
            loader={<CollectibleImageLoader />}
            fallback={<CollectibleImageFallback isAudioCollectible={isAudioCollectible} />}
          />
        )}
      </div>
    );
  }
);
