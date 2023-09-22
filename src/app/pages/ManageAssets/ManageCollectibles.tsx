import React, { memo, useCallback, useMemo } from 'react';

import classNames from 'clsx';
import { useDispatch } from 'react-redux';

import { ReactComponent as AddIcon } from 'app/icons/add-to-list.svg';
import { ManageAssetsSelectors } from 'app/pages/ManageAssets/selectors';
import { setAssetStatusAction } from 'app/store/assets/actions';
import { useAreAssetsLoading } from 'app/store/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tokens-metadata/selectors';
import SearchAssetField from 'app/templates/SearchAssetField';
import { useAccountCollectibles } from 'lib/assets/hooks';
import { useFilteredAssetsSlugs } from 'lib/assets/use-filtered';
import { T, t } from 'lib/i18n';
import { useAccount, useChainId } from 'lib/temple/front';
import { useConfirm } from 'lib/ui/dialog';
import { Link } from 'lib/woozie';

import { ListItem } from './ListItem';
import { Loader } from './Loader';

export const ManageCollectiblesContent = memo(() => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();

  const dispatch = useDispatch();

  const collectibles = useAccountCollectibles(publicKeyHash, chainId);

  const slugs = useMemo(() => collectibles.map(c => c.slug), [collectibles]);

  const assetsAreLoading = useAreAssetsLoading('collectibles');
  const metadatasLoading = useTokensMetadataLoadingSelector();
  const isLoading = assetsAreLoading || metadatasLoading;

  const { filteredAssets, searchValue, setSearchValue } = useFilteredAssetsSlugs(slugs, false);

  const confirm = useConfirm();

  const removeItem = useCallback(
    async (slug: string) => {
      try {
        const confirmed = await confirm({
          title: t('deleteCollectibleConfirm')
        });

        if (confirmed)
          dispatch(
            setAssetStatusAction({ isCollectible: true, account: publicKeyHash, chainId, slug, status: 'removed' })
          );
      } catch (err: any) {
        console.error(err);
        alert(err.message);
      }
    },
    [chainId, publicKeyHash, confirm]
  );

  const toggleAssetStatus = useCallback(
    (slug: string, toDisable: boolean) =>
      void dispatch(
        setAssetStatusAction({
          isCollectible: true,
          account: publicKeyHash,
          chainId,
          slug,
          status: toDisable ? 'disabled' : 'enabled'
        })
      ),
    [chainId, publicKeyHash]
  );

  return (
    <div className="w-full max-w-sm mx-auto mb-6">
      <div className="mb-3 w-full flex">
        <SearchAssetField
          value={searchValue}
          onValueChange={setSearchValue}
          testID={ManageAssetsSelectors.searchAssetsInput}
        />

        <Link
          to="/add-asset"
          className={classNames(
            'flex items-center ml-2 flex-shrink-0 px-3 py-1 text-gray-600 text-sm rounded overflow-hidden',
            'opacity-75 hover:bg-gray-100 hover:opacity-100 focus:opacity-100',
            'transition ease-in-out duration-200'
          )}
          testID={ManageAssetsSelectors.addCollectiblesButton}
        >
          <AddIcon className="mr-1 h-5 w-auto stroke-current stroke-2" />
          <T id="addCollectible" />
        </Link>
      </div>

      {filteredAssets.length > 0 ? (
        <div className="flex flex-col w-full overflow-hidden border rounded-md text-gray-700 text-sm leading-tight">
          {filteredAssets.map((slug, i, arr) => {
            const last = i === arr.length - 1;

            const status = collectibles.find(t => t.slug === slug)!.status;

            return (
              <ListItem
                key={slug}
                assetSlug={slug}
                last={last}
                checked={status === 'enabled'}
                onRemove={removeItem}
                onToggle={toggleAssetStatus}
              />
            );
          })}
        </div>
      ) : (
        isLoading || <Loader collectibles searchActive={Boolean(searchValue)} />
      )}
    </div>
  );
});
