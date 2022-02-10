import React, { FC } from 'react';

import classNames from 'clsx';

import { AssetIcon } from 'app/templates/AssetIcon';
import { AssetMetadata, useAssetMetadata } from 'lib/temple/front';

import { AssetOptionBalance } from './AssetOptionBalance';

interface Props {
  assetSlug: string;
  isLast: boolean;
  onClick: (newValue: string) => void;
}

export const AssetOption: FC<Props> = ({ assetSlug, isLast, onClick }) => {
  const assetMetadata: AssetMetadata | null = useAssetMetadata(assetSlug);

  const handleClick = () => onClick(assetSlug);

  return assetMetadata ? (
    <button
      type="button"
      onClick={handleClick}
      className={classNames(!isLast && 'border-b border-gray-300', 'p-4 w-full flex items-center')}
    >
      <AssetIcon assetSlug={assetSlug} size={32} className="mr-2" />
      <span className="text-gray-700 text-lg mr-2">{assetMetadata.symbol}</span>
      <div className="flex-1 text-right text-lg text-gray-600">
        <AssetOptionBalance assetSlug={assetSlug} />
      </div>
    </button>
  ) : null;
};
