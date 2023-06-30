import React, { FC } from 'react';

import classNames from 'clsx';
import { ListRowProps } from 'react-virtualized';

import { AssetIcon } from 'app/templates/AssetIcon';
import { AssetItemContent } from 'app/templates/AssetItemContent';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { useAssetMetadata } from 'lib/metadata';
import { isTruthy } from 'lib/utils';

import { AssetsMenuSelectors } from './selectors';

interface Props extends Partial<Pick<ListRowProps, 'style'>> {
  assetSlug: string;
  selected?: boolean;
  onClick: (newValue: string) => void;
}

export const AssetOption: FC<Props> = ({ assetSlug, selected, style, onClick }) => {
  const assetMetadata = useAssetMetadata(assetSlug);

  const handleClick = () => onClick(assetSlug);

  if (!isTruthy(assetMetadata)) return null;

  return (
    <button
      type="button"
      style={style}
      className={classNames(
        'py-1.5 px-2 w-full flex items-center rounded',
        selected ? 'bg-gray-200' : 'hover:bg-gray-100'
      )}
      onClick={handleClick}
      {...setTestID(AssetsMenuSelectors.assetsMenuAssetItem)}
      {...setAnotherSelector('slug', assetSlug)}
    >
      <AssetIcon assetSlug={assetSlug} size={32} className="mx-2" />

      <AssetItemContent slug={assetSlug} metadata={assetMetadata} />
    </button>
  );
};
