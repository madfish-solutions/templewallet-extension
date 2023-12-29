import React, { FC, memo, PropsWithChildren, useCallback } from 'react';

import clsx from 'clsx';

import { ReactComponent as AddIcon } from 'app/icons/add-to-list.svg';
import { dispatch } from 'app/store';
import { setTokenStatusAction, setCollectibleStatusAction } from 'app/store/assets/actions';
import SearchAssetField from 'app/templates/SearchAssetField';
import { AccountAsset } from 'lib/assets/types';
import { t, T } from 'lib/i18n';
import type { TokenMetadataGetter } from 'lib/metadata';
import { useAccount, useChainId } from 'lib/temple/front';
import { useConfirm } from 'lib/ui/dialog';
import { Link } from 'lib/woozie';

import { ListItem } from './ListItem';
import { ManageAssetsSelectors } from './selectors';

interface Props extends PropsWithChildren {
  ofCollectibles?: boolean;
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

interface ManageAssetsContentListProps {
  ofCollectibles?: boolean;
  assets: AccountAsset[];
  getMetadata: TokenMetadataGetter;
}

export const ManageAssetsContentList = memo<ManageAssetsContentListProps>(({ ofCollectibles, assets, getMetadata }) => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();

  const confirm = useConfirm();

  const removeItem = useCallback(
    async (slug: string) => {
      try {
        const confirmed = await confirm({
          title: t(ofCollectibles ? 'deleteCollectibleConfirm' : 'deleteTokenConfirm')
        });

        if (confirmed)
          dispatch(
            (ofCollectibles ? setCollectibleStatusAction : setTokenStatusAction)({
              account: publicKeyHash,
              chainId,
              slug,
              status: 'removed'
            })
          );
      } catch (err: any) {
        console.error(err);
        alert(err.message);
      }
    },
    [ofCollectibles, chainId, publicKeyHash, confirm]
  );

  const toggleTokenStatus = useCallback(
    (slug: string, toDisable: boolean) =>
      void dispatch(
        (ofCollectibles ? setCollectibleStatusAction : setTokenStatusAction)({
          account: publicKeyHash,
          chainId,
          slug,
          status: toDisable ? 'disabled' : 'enabled'
        })
      ),
    [ofCollectibles, chainId, publicKeyHash]
  );

  return (
    <div className="flex flex-col w-full overflow-hidden border rounded-md text-gray-700 text-sm leading-tight">
      {assets.map(({ slug, status }, i, arr) => {
        const metadata = getMetadata(slug);

        const last = i === arr.length - 1;

        return (
          <ListItem
            key={slug}
            assetSlug={slug}
            metadata={metadata}
            last={last}
            checked={status === 'enabled'}
            onRemove={removeItem}
            onToggle={toggleTokenStatus}
          />
        );
      })}
    </div>
  );
});
