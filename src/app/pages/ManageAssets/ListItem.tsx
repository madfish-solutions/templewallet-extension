import React, { memo, useCallback } from 'react';

import clsx from 'clsx';

import Checkbox from 'app/atoms/Checkbox';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { ManageAssetsSelectors } from 'app/pages/ManageAssets/selectors';
import { AssetIcon } from 'app/templates/AssetIcon';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { t } from 'lib/i18n';
import { getAssetName, getAssetSymbol, AssetMetadataBase } from 'lib/metadata';

type Props = {
  assetSlug: string;
  metadata?: AssetMetadataBase;
  last: boolean;
  checked: boolean;
  onToggle: (slug: string, newState: boolean) => void;
  onRemove: (slug: string) => void;
};

export const ListItem = memo<Props>(({ assetSlug, metadata, last, checked, onToggle, onRemove }) => {
  const onCheckboxChange = useCallback((checked: boolean) => void onToggle(assetSlug, !checked), [assetSlug, onToggle]);

  const onRemoveBtnClick = useCallback<React.MouseEventHandler<HTMLDivElement>>(
    event => {
      event.preventDefault();
      onRemove(assetSlug);
    },
    [assetSlug, onRemove]
  );

  return (
    <label
      className={clsx(
        !last && 'border-b border-gray-200',
        checked ? 'bg-gray-100' : 'hover:bg-gray-100 focus:bg-gray-100',
        'block w-full flex items-center py-2 px-3 text-gray-700',
        'focus:outline-none overflow-hidden cursor-pointer',
        'transition ease-in-out duration-200'
      )}
      {...setTestID(ManageAssetsSelectors.assetItem)}
      {...setAnotherSelector('slug', assetSlug)}
    >
      <AssetIcon assetSlug={assetSlug} size={32} className="mr-3 flex-shrink-0" />

      <div className="flex items-center max-w-56">
        <div className="flex flex-col items-start w-full">
          <div className="text-sm font-normal text-gray-700 truncate w-full m-b-0.5">{getAssetName(metadata)}</div>

          <div className="text-xs font-light text-gray-600 truncate w-full">{getAssetSymbol(metadata)}</div>
        </div>
      </div>

      <div className="flex-1" />

      <div
        className={clsx(
          'mr-2 p-1 rounded-full text-gray-400',
          'hover:text-gray-600 hover:bg-black hover:bg-opacity-5',
          'transition ease-in-out duration-200'
        )}
        onClick={onRemoveBtnClick}
        {...setTestID(ManageAssetsSelectors.deleteAssetButton)}
        {...setAnotherSelector('slug', assetSlug)}
      >
        <CloseIcon className="w-auto h-4 stroke-current stroke-2" title={t('delete')} />
      </div>

      <Checkbox checked={checked} onChange={onCheckboxChange} />
    </label>
  );
});
