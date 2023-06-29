import React from 'react';

import clsx from 'clsx';

import { SyncSpinner } from 'app/atoms';
import { useAppEnv } from 'app/env';
import { ReactComponent as ManageIcon } from 'app/icons/manage.svg';
import { CollectibleItem } from 'app/pages/Collectibles/CollectibleItem';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import SearchAssetField from 'app/templates/SearchAssetField';
import { AssetTypesEnum } from 'lib/assets/types';
import { T, t } from 'lib/i18n';
import { useAccount, useChainId, useCollectibleTokens, useFilteredAssets } from 'lib/temple/front';
import { useSyncTokens } from 'lib/temple/front/sync-tokens';
import { Link } from 'lib/woozie';

export const CollectiblesTab = () => {
  const chainId = useChainId(true)!;
  const { popup } = useAppEnv();
  const { publicKeyHash } = useAccount();
  const { isSyncing } = useSyncTokens();

  const { data: collectibles = [] } = useCollectibleTokens(chainId, publicKeyHash, true);

  const collectibleSlugs = collectibles.map(collectible => collectible.tokenSlug);

  const { filteredAssets, searchValue, setSearchValue } = useFilteredAssets(collectibleSlugs);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className={clsx('my-3', popup && 'mx-4')}>
        <div className="mb-4 w-full flex items-strech">
          <SearchAssetField
            value={searchValue}
            onValueChange={setSearchValue}
            testID={AssetsSelectors.searchAssetsInputCollectibles}
          />

          <Link
            to={`/manage-assets/${AssetTypesEnum.Collectibles}`}
            title={t('manage')}
            className={clsx(
              'flex flex-shrink-0 items-center justify-center',
              'w-10 ml-2 rounded-lg',
              'transition ease-in-out duration-200',
              'hover:bg-gray-100',
              'opacity-75 hover:opacity-100 focus:opacity-100'
            )}
            testID={AssetsSelectors.manageButton}
          >
            <ManageIcon className="h-4" />
          </Link>
        </div>

        {isSyncing && filteredAssets.length === 0 ? (
          <SyncSpinner className="mt-6" />
        ) : filteredAssets.length === 0 ? (
          <div className="w-full border rounded border-gray-200">
            <p className={'text-gray-600 text-center text-xs py-6'}>
              <T id="zeroCollectibleText" />
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1">
              {filteredAssets.map((slug, index) => (
                <CollectibleItem key={slug} assetSlug={slug} index={index} itemsLength={filteredAssets.length} />
              ))}
            </div>

            {isSyncing && <SyncSpinner className="mt-6" />}
          </>
        )}
      </div>
    </div>
  );
};
