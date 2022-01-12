import React, { FC } from 'react';

import { useAssetMetadata } from 'lib/temple/front';
import { Link } from 'lib/woozie';

import AssetIcon from '../../templates/AssetIcon';

interface Props {
  assetSlug: string;
  index: number;
  itemsLength: number;
}

const CollectibleItem: FC<Props> = ({ assetSlug, index, itemsLength }) => {
  const collectibleMetadata = useAssetMetadata(assetSlug)!;
  return (
    <Link to={`/collectible/${assetSlug}`}>
      <div className="flex items-center" style={index === itemsLength - 1 ? {} : { borderBottom: '1px solid #e2e8f0' }}>
        <div className="p-2">
          <div
            style={{ borderRadius: '12px' }}
            className="border border-gray-300 w-16 h-16 flex items-center justify-center"
          >
            <AssetIcon assetSlug={assetSlug} className="w-12 h-12" />
          </div>
        </div>
        <div className="pl-2">
          <p style={{ color: '#1B262C' }} className="text-sm">
            {collectibleMetadata.name}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default CollectibleItem;
