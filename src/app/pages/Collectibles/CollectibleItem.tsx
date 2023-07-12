import React, { FC, useCallback, useRef, useState } from 'react';

import { AssetIcon } from 'app/templates/AssetIcon';
import { useAssetMetadata, getAssetName } from 'lib/metadata';
import { useIntersectionDetection } from 'lib/ui/use-intersection-detection';
import { Link } from 'lib/woozie';

interface Props {
  assetSlug: string;
  index: number;
  itemsLength: number;
}

export const CollectibleItem: FC<Props> = ({ assetSlug, index, itemsLength }) => {
  const metadata = useAssetMetadata(assetSlug);
  const toDisplayRef = useRef<HTMLDivElement>(null);
  const [displayed, setDisplayed] = useState(true);

  const handleIntersection = useCallback(() => {
    setDisplayed(true);
  }, [setDisplayed]);

  useIntersectionDetection(toDisplayRef, handleIntersection, !displayed);

  if (metadata == null) return null;

  return (
    <Link to={`/collectible/${assetSlug}`}>
      <div className="flex items-center" style={index === itemsLength - 1 ? {} : { borderBottom: '1px solid #e2e8f0' }}>
        <div className="p-2">
          <div
            ref={toDisplayRef}
            style={{ borderRadius: '12px' }}
            className="border border-gray-300 w-16 h-16 flex items-center justify-center overflow-hidden p-2"
          >
            {displayed && <AssetIcon assetSlug={assetSlug} className="w-12 h-12" />}
          </div>
        </div>
        <div className="pl-2">
          <p className="text-sm text-gray-910">{getAssetName(metadata)}</p>
        </div>
      </div>
    </Link>
  );
};
