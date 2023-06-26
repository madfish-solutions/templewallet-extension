import React, { FC, useCallback, useRef, useState } from 'react';

import Spinner from 'app/atoms/Spinner/Spinner';
import { useAppEnv } from 'app/env';
import { ReactComponent as BrokenImageSvg } from 'app/icons/broken-image.svg';
import { AssetImage } from 'app/templates/AssetImage';
import { useAssetMetadata, getAssetName } from 'lib/metadata';
import { useIntersectionDetection } from 'lib/ui/use-intersection-detection';
import { Link } from 'lib/woozie';

interface Props {
  assetSlug: string;
  index: number;
  itemsLength: number;
  detailsShown?: boolean;
}

export const CollectibleItem: FC<Props> = ({ assetSlug, detailsShown }) => {
  const { popup } = useAppEnv();
  const metadata = useAssetMetadata(assetSlug);
  const toDisplayRef = useRef<HTMLDivElement>(null);
  const [displayed, setDisplayed] = useState(true);

  const handleIntersection = useCallback(() => {
    setDisplayed(true);
  }, [setDisplayed]);

  useIntersectionDetection(toDisplayRef, handleIntersection, !displayed);

  if (metadata == null) return null;

  return (
    <Link to={`/collectible/${assetSlug}`} className="flex flex-col">
      <div
        ref={toDisplayRef}
        className="bg-blue-50 rounded-lg overflow-hidden hover:opacity-70"
        style={{ height: popup ? 106 : 125 }}
      >
        {displayed && (
          <AssetImage
            metadata={metadata}
            assetSlug={assetSlug}
            className="m-auto"
            loader={<ImageLoader />}
            fallback={<ImageFallback />}
          />
        )}
      </div>

      {detailsShown && (
        <div className="mt-2">
          <p className="text-sm text-gray-910">{getAssetName(metadata)}</p>
        </div>
      )}
    </Link>
  );
};

const ImageLoader: FC = () => (
  <div className="w-full h-full flex items-center justify-center">
    <Spinner theme="dark-gray" className="w-8" />
  </div>
);

const ImageFallback: FC = () => (
  <div className="w-full h-full flex items-center justify-center">
    <BrokenImageSvg height="32%" />
  </div>
);
