import React, { FC, PropsWithChildren } from 'react';

import clsx from 'clsx';

import { ReactComponent as AddIcon } from 'app/icons/add-to-list.svg';
import SearchAssetField from 'app/templates/SearchAssetField';
import { T } from 'lib/i18n';
import { Link } from 'lib/woozie';

import { ManageAssetsSelectors } from './selectors';

export const WRAPPER_CLASSNAME =
  'flex flex-col w-full overflow-hidden border rounded-md text-gray-700 text-sm leading-tight';

interface Props extends PropsWithChildren {
  ofCollectibles: boolean;
  searchValue: string;
  setSearchValue: (value: string) => void;
}

export const ManageAssetsContent: FC<Props> = ({ ofCollectibles, searchValue, setSearchValue, children }) => (
  <div className="w-full max-w-sm mx-auto mb-6">
    <div className="mb-3 w-full flex">
      <SearchAssetField
        value={searchValue}
        onValueChange={setSearchValue}
        testID={ManageAssetsSelectors.searchAssetsInput}
      />

      <Link
        to="/add-asset"
        className={clsx(
          'flex items-center ml-2 flex-shrink-0 px-3 py-1 text-gray-600 text-sm rounded overflow-hidden',
          'opacity-75 hover:bg-gray-100 hover:opacity-100 focus:opacity-100',
          'transition ease-in-out duration-200'
        )}
        testID={ManageAssetsSelectors[ofCollectibles ? 'addCollectiblesButton' : 'addAssetButton']}
      >
        <AddIcon className="mr-1 h-5 w-auto stroke-current stroke-2" />
        <T id={ofCollectibles ? 'addCollectible' : 'addToken'} />
      </Link>
    </div>

    {children}
  </div>
);
