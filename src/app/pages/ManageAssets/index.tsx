import React, { memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import { ReactComponent as AddIcon } from 'app/icons/add-to-list.svg';
import { ReactComponent as ControlCentreIcon } from 'app/icons/control-centre.svg';
import PageLayout from 'app/layouts/PageLayout';
import { dispatch } from 'app/store';
import { setAssetStatusAction } from 'app/store/assets/actions';
import { useAreAssetsLoading } from 'app/store/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tokens-metadata/selectors';
import SearchAssetField from 'app/templates/SearchAssetField';
import { TEMPLE_TOKEN_SLUG } from 'lib/assets';
import { AccountAsset, useAccountCollectibles, useAllAvailableTokens } from 'lib/assets/hooks';
import { AssetTypesEnum } from 'lib/assets/types';
import { useFilteredAssetsSlugs } from 'lib/assets/use-filtered';
import { t, T } from 'lib/i18n';
import { useAccount, useChainId } from 'lib/temple/front';
import { useConfirm } from 'lib/ui/dialog';
import { Link } from 'lib/woozie';

import { ListItem } from './ListItem';
import { Loader } from './Loader';
import { ManageAssetsSelectors } from './selectors';

interface Props {
  assetType: string;
}

const ManageAssets = memo<Props>(({ assetType }) => (
  <PageLayout
    pageTitle={
      <>
        <ControlCentreIcon className="w-auto h-4 mr-1 stroke-current" />
        <T id={assetType === AssetTypesEnum.Collectibles ? 'manageCollectibles' : 'manageTokens'} />
      </>
    }
  >
    {assetType === AssetTypesEnum.Collectibles ? <ManageCollectiblesContent /> : <ManageTokensContent />}
  </PageLayout>
));

export default ManageAssets;

const ManageTokensContent = memo(() => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();

  const tokens = useAllAvailableTokens(publicKeyHash, chainId);

  const managebleSlugs = useMemo(
    () => tokens.reduce<string[]>((acc, { slug }) => (slug === TEMPLE_TOKEN_SLUG ? acc : acc.concat(slug)), []),
    [tokens]
  );

  return <ManageAssetsContent account={publicKeyHash} chainId={chainId} assets={tokens} slugs={managebleSlugs} />;
});

const ManageCollectiblesContent = memo(() => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();

  const collectibles = useAccountCollectibles(publicKeyHash, chainId);

  const slugs = useMemo(() => collectibles.map(c => c.slug), [collectibles]);

  return <ManageAssetsContent account={publicKeyHash} chainId={chainId} assets={collectibles} slugs={slugs} />;
});

interface ManageAssetsContentProps {
  ofCollectibles?: boolean;
  account: string;
  chainId: string;
  assets: AccountAsset[];
  slugs: string[];
}

const ManageAssetsContent = memo<ManageAssetsContentProps>(({ ofCollectibles, account, chainId, assets, slugs }) => {
  const assetsAreLoading = useAreAssetsLoading(ofCollectibles ? 'collectibles' : 'tokens');
  const metadatasLoading = useTokensMetadataLoadingSelector();
  const isLoading = assetsAreLoading || metadatasLoading;

  const { filteredAssets, searchValue, setSearchValue } = useFilteredAssetsSlugs(slugs, false);

  const confirm = useConfirm();

  const removeItem = useCallback(
    async (slug: string) => {
      try {
        const confirmed = await confirm({
          title: t(ofCollectibles ? 'deleteCollectibleConfirm' : 'deleteTokenConfirm')
        });

        if (confirmed)
          dispatch(setAssetStatusAction({ isCollectible: ofCollectibles, account, chainId, slug, status: 'removed' }));
      } catch (err: any) {
        console.error(err);
        alert(err.message);
      }
    },
    [ofCollectibles, chainId, account, confirm]
  );

  const toggleTokenStatus = useCallback(
    (slug: string, toDisable: boolean) =>
      void dispatch(
        setAssetStatusAction({
          isCollectible: ofCollectibles,
          account,
          chainId,
          slug,
          status: toDisable ? 'disabled' : 'enabled'
        })
      ),
    [ofCollectibles, chainId, account]
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

      {filteredAssets.length > 0 ? (
        <div className="flex flex-col w-full overflow-hidden border rounded-md text-gray-700 text-sm leading-tight">
          {filteredAssets.map((slug, i, arr) => {
            const last = i === arr.length - 1;
            const status = assets.find(t => t.slug === slug)!.status;

            return (
              <ListItem
                key={slug}
                assetSlug={slug}
                last={last}
                checked={status === 'enabled'}
                onRemove={removeItem}
                onToggle={toggleTokenStatus}
              />
            );
          })}
        </div>
      ) : (
        isLoading || <Loader ofCollectibles={ofCollectibles} searchActive={Boolean(searchValue)} />
      )}
    </div>
  );
});
