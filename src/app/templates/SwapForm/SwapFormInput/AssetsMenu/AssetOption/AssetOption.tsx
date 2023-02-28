import React, { FC } from 'react';

import { ListRowProps } from 'react-virtualized';

import { AssetIcon } from 'app/templates/AssetIcon';
import { useAssetMetadata } from 'lib/temple/front';
import { AssetMetadata } from 'lib/temple/metadata';
import { isTruthy } from 'lib/utils';

import { AssetOptionBalance } from './AssetOptionBalance';

interface Props extends Partial<Pick<ListRowProps, 'style'>> {
  assetSlug: string;
  onClick: (newValue: string) => void;
}

export const AssetOption: FC<Props> = ({ assetSlug, style, onClick }) => {
  const assetMetadata: AssetMetadata | null = useAssetMetadata(assetSlug);

  const handleClick = () => onClick(assetSlug);

  if (!isTruthy(assetMetadata)) return null;

  return (
    <button
      type="button"
      style={style}
      className="py-3 px-4 w-full flex items-center hover:bg-gray-200"
      onClick={handleClick}
    >
      <AssetIcon assetSlug={assetSlug} size={32} className="mr-2" />
      <div className="flex flex-col items-start mr-2">
        <span className="text-gray-910 text-lg">{assetMetadata.symbol}</span>
        <span className="text-gray-600 text-xs">{assetMetadata.name}</span>
      </div>
      <div className="flex-1 flex flex-col text-right">
        <AssetOptionBalance assetSlug={assetSlug} />
      </div>
    </button>
  );
};
