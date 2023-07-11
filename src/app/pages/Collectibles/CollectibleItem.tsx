import React, { FC, useCallback, useRef, useState } from 'react';

import { useAppEnv } from 'app/env';
import { useAssetMetadata, getAssetName } from 'lib/metadata';
import { useIntersectionDetection } from 'lib/ui/use-intersection-detection';
import { Link } from 'lib/woozie';

import { CollectibleImage } from './CollectibleImage';

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

  return (
    <Link to={`/collectible/${assetSlug}`} className="flex flex-col border border-gray-300 rounded-lg">
      <div
        ref={toDisplayRef}
        className="flex items-center justify-center bg-blue-50 rounded-lg overflow-hidden hover:opacity-70"
        style={{ height: popup ? 106 : 125 }}
      >
        {displayed && <CollectibleImage metadata={metadata} assetSlug={assetSlug} />}
      </div>

      {detailsShown && (
        <div className="mt-2">
          <p className="text-sm text-gray-910">{getAssetName(metadata)}</p>
        </div>
      )}
    </Link>
  );
};
