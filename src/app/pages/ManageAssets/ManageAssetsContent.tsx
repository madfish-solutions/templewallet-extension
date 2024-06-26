import React, { FC, memo, PropsWithChildren, useCallback } from 'react';

import clsx from 'clsx';

import { CaptionAlert } from 'app/atoms';
import { ReactComponent as AddIcon } from 'app/icons/add-to-list.svg';
import { dispatch } from 'app/store';
import { setCollectibleStatusAction, setTokenStatusAction } from 'app/store/tezos/assets/actions';
import { SearchBarField } from 'app/templates/SearchField';
import { AccountAsset } from 'lib/assets/types';
import { t, T } from 'lib/i18n';
import type { TokenMetadataGetter } from 'lib/metadata';
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
  <>
    <div className="flex gap-x-2">
      <SearchBarField
        value={searchValue}
        onValueChange={setSearchValue}
        testID={ManageAssetsSelectors.searchAssetsInput}
      />

      <Link
        to="/add-asset"
        className={clsx(
          'flex items-center flex-shrink-0 px-3 py-1 text-gray-600 text-sm rounded overflow-hidden',
          'opacity-75 hover:bg-gray-100 hover:opacity-100 focus:opacity-100',
          'transition ease-in-out duration-200'
        )}
        testID={ManageAssetsSelectors[ofCollectibles ? 'addCollectiblesButton' : 'addAssetButton']}
      >
        <AddIcon className="mr-1 h-5 w-auto stroke-current stroke-2" />
        <T id={ofCollectibles ? 'addCollectible' : 'addToken'} />
      </Link>
    </div>

    <CaptionAlert
      type="info"
      className="my-4"
      message="To add another token, enter the token address into the search bar"
    />

    {children}
  </>
);

interface ManageAssetsContentListProps {
  tezosChainId: string;
  publicKeyHash: string;
  ofCollectibles?: boolean;
  assets: AccountAsset[];
  getMetadata: TokenMetadataGetter;
}

export const ManageAssetsContentList = memo<ManageAssetsContentListProps>(
  ({ tezosChainId: chainId, publicKeyHash, ofCollectibles, assets, getMetadata }) => {
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
              tezosChainId={chainId}
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
  }
);
