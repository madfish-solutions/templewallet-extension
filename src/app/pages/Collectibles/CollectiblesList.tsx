import React, { useCallback, useMemo, useRef } from 'react';

import classNames from 'clsx';

import { ActivitySpinner } from 'app/atoms';
import { useAppEnv } from 'app/env';
import { ReactComponent as AddToListIcon } from 'app/icons/add-to-list.svg';
import CollectibleItem from 'app/pages/Collectibles/CollectibleItem';
import { AssetsSelectors } from 'app/pages/Explore/Assets.selectors';
import SearchAssetField from 'app/templates/SearchAssetField';
import { T } from 'lib/i18n/react';
import { AssetTypesEnum } from 'lib/temple/assets';
import {
  useAccount,
  useChainId,
  useAllTokensBaseMetadata,
  useCollectibleTokens,
  useNonFungibleTokensBalances,
  useFilteredAssets
} from 'lib/temple/front';
import { TZKT_FETCH_QUERY_SIZE } from 'lib/tzkt';
import { useIntersectionDetection } from 'lib/ui/use-intersection-detection';
import { Link } from 'lib/woozie';

const CollectiblesList = () => {
  const chainId = useChainId(true)!;
  const account = useAccount();
  const { popup } = useAppEnv();
  const address = account.publicKeyHash;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const canLoadMore = useRef(true);
  const { hasMore, loadItems, isLoading, items } = useNonFungibleTokensBalances();
  const { data: collectibles = [] } = useCollectibleTokens(chainId, address, true);

  const allTokensBaseMetadata = useAllTokensBaseMetadata();

  const assetSlugs = useMemo(() => {
    const slugs = [];

    for (const { tokenSlug } of collectibles) {
      if (tokenSlug in allTokensBaseMetadata) {
        slugs.push(tokenSlug);
      }
    }
    canLoadMore.current = true;

    return slugs;
  }, [collectibles, allTokensBaseMetadata]);

  const { filteredAssets, searchValue, setSearchValue } = useFilteredAssets(assetSlugs);

  const handleLoadItems = useCallback(() => {
    if (canLoadMore.current) {
      canLoadMore.current = false;
      loadItems();
    }
  }, [loadItems]);

  const handleIntersection = useCallback(() => {
    if (!isLoading && hasMore && items.length >= TZKT_FETCH_QUERY_SIZE) {
      handleLoadItems();
    }
  }, [handleLoadItems, isLoading, hasMore, items.length]);

  useIntersectionDetection(loadMoreRef, handleIntersection);

  return (
    <div className={classNames('w-full max-w-sm mx-auto')}>
      <div className={classNames('mt-3', popup && 'mx-4')}>
        <div className="mb-3 w-full flex items-strech">
          <SearchAssetField value={searchValue} onValueChange={setSearchValue} />

          <Link
            to={`/manage-assets/${AssetTypesEnum.Collectibles}`}
            className={classNames(
              'ml-2 flex-shrink-0',
              'px-3 py-1',
              'rounded overflow-hidden',
              'flex items-center',
              'text-gray-600 text-sm',
              'transition ease-in-out duration-200',
              'hover:bg-gray-100',
              'opacity-75 hover:opacity-100 focus:opacity-100'
            )}
            testID={AssetsSelectors.ManageButton}
          >
            <AddToListIcon className={classNames('mr-1 h-5 w-auto stroke-current stroke-2')} />
            <T id="manage" />
          </Link>
        </div>
        <div className="mt-1 mb-3 w-full border rounded border-gray-200">
          {filteredAssets.length === 0 ? (
            <p className={'text-gray-600 text-center text-xs py-6'}>
              <T id="zeroCollectibleText" />
            </p>
          ) : (
            <>
              {filteredAssets.map((item, index) => (
                <CollectibleItem key={item} assetSlug={item} index={index} itemsLength={filteredAssets.length} />
              ))}
            </>
          )}
        </div>
        {hasMore && <div ref={loadMoreRef} className="w-full flex justify-center mt-5 mb-3"></div>}
        {hasMore && !canLoadMore.current && <ActivitySpinner />}
      </div>
    </div>
  );
};

export default CollectiblesList;
