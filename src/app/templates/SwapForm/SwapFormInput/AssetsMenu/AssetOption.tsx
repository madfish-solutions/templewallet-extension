import React, { FC } from 'react';

import classNames from 'clsx';
import { ListRowProps } from 'react-virtualized';

import { AssetIcon } from 'app/templates/AssetIcon';
import { AssetItemContent } from 'app/templates/AssetItemContent';
import { setTestID } from 'lib/analytics';
import { useAssetMetadata } from 'lib/metadata';
import { isTruthy } from 'lib/utils';

import { AssetsMenuSelectors } from './selectors';

interface Props extends Partial<Pick<ListRowProps, 'style'>> {
  assetSlug: string;
  selected?: boolean;
}

export const AssetOption: FC<Props> = ({ assetSlug, selected }) => {
  const assetMetadata = useAssetMetadata(assetSlug);

  if (!isTruthy(assetMetadata)) return null;

  return (
    <div
      className={classNames(
        'py-1.5 px-2 w-full flex items-center rounded h-16',
        selected ? 'bg-gray-200' : 'hover:bg-gray-100'
      )}
      {...setTestID(AssetsMenuSelectors.assetsMenuAssetItem)}
    >
      <AssetIcon assetSlug={assetSlug} size={32} className="mx-2" />

      <AssetItemContent slug={assetSlug} metadata={assetMetadata} />
    </div>
  );
};
