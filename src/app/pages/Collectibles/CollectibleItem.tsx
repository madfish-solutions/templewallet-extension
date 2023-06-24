import React, { FC, useCallback, useRef, useState } from 'react';

import { useAppEnv } from 'app/env';
import { CollectibleItemImage } from 'app/pages/Collectibles/CollectibleItemImage';
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
      <div ref={toDisplayRef} style={{ height: popup ? 106 : 125 }}>
        {displayed && <CollectibleItemImage metadata={metadata} assetSlug={assetSlug} className="m-auto" />}
      </div>

      {detailsShown && (
        <div className="mt-2">
          <p className="text-sm text-gray-910">{getAssetName(metadata)}</p>
        </div>
      )}
    </Link>
  );
};
