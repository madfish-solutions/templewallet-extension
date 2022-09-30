import React, { FC } from 'react';

import { ListRowProps } from 'react-virtualized';

import { AssetIcon } from 'app/templates/AssetIcon';
import { useAssetMetadata } from 'lib/temple/front';
import { AssetMetadata } from 'lib/temple/metadata';

import { AssetOptionBalance } from './AssetOptionBalance';

interface Props extends Partial<Pick<ListRowProps, 'style'>> {
  assetSlug: string;
  onClick: (newValue: string) => void;
}

export const AssetOption: FC<Props> = ({ assetSlug, style, onClick }) => {
  const assetMetadata: AssetMetadata | null = useAssetMetadata(assetSlug);

  const handleClick = () => onClick(assetSlug);

  return assetMetadata ? (
    <button type="button" style={style} className="p-4 w-full flex items-center" onClick={handleClick}>
      <AssetIcon assetSlug={assetSlug} size={32} className="mr-2" />
      <span className="text-gray-700 text-lg mr-2">{assetMetadata.symbol}</span>
      <div className="flex-1 text-right text-lg text-gray-600">
        <AssetOptionBalance assetSlug={assetSlug} />
      </div>
    </button>
  ) : null;
};
