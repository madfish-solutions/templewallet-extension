import React, { memo, useMemo, useState } from 'react';

import { isEqual } from 'lodash';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useDebounce } from 'use-debounce';

import { SyncSpinner } from 'app/atoms';
import { ITEMS_PER_PAGE, useCollectiblesWithLoading } from 'app/hooks/use-collectibles-with-loading';
import { useAreAssetsLoading } from 'app/store/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tokens-metadata/selectors';
import { useAccountCollectibles } from 'lib/assets/hooks';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useCollectiblesSortPredicate } from 'lib/assets/use-filtered';
import { useAssetsMetadataWithPresenceCheck } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';

import { AssetsPlaceholder } from './AssetsPlaceholder';
import { ListItem } from './ListItem';
import { WRAPPER_CLASSNAME, ManageAssetsContent } from './ManageAssetsContent';
import { ManageAssetsCommonProps } from './utils';

export const ManageCollectibles = memo<ManageAssetsCommonProps>(
  ({ chainId, publicKeyHash, removeItem, toggleTokenStatus }) => {
    const collectibles = useAccountCollectibles(publicKeyHash, chainId);

    const assetsAreLoading = useAreAssetsLoading('collectibles');
    const tokensMetadataLoading = useTokensMetadataLoadingSelector();

    const assetsSortPredicate = useCollectiblesSortPredicate();

    const allSlugsSorted = useMemoWithCompare(
      () => collectibles.map(c => c.slug).sort(assetsSortPredicate),
      [collectibles, assetsSortPredicate],
      isEqual
    );

    const { slugs: paginatedSlugs, isLoading, loadNext, loadNextSeed } = useCollectiblesWithLoading(allSlugsSorted);

    const [searchValue, setSearchValue] = useState('');
    const [searchValueDebounced] = useDebounce(searchValue, 300);

    const isInSearch = isSearchStringApplicable(searchValueDebounced);

    const isSyncing = isInSearch ? assetsAreLoading || tokensMetadataLoading : assetsAreLoading || isLoading;

    const metaToCheckAndLoad = useMemo(() => {
      // Search is not paginated. This is how all needed meta is loaded
      if (isInSearch) return allSlugsSorted;

      // In pagination, loading meta for the following pages in advance,
      // while not required in current page
      return isLoading ? undefined : allSlugsSorted.slice(paginatedSlugs.length + ITEMS_PER_PAGE * 2);
    }, [isInSearch, isLoading, allSlugsSorted, paginatedSlugs.length]);

    const allTokensMetadata = useAssetsMetadataWithPresenceCheck(metaToCheckAndLoad);

    const displayedSlugs = useMemo(
      () =>
        isInSearch
          ? searchAssetsWithNoMeta(searchValueDebounced, allSlugsSorted, allTokensMetadata, slug => slug).sort(
              assetsSortPredicate
            )
          : paginatedSlugs,
      [isInSearch, paginatedSlugs, searchValueDebounced, allSlugsSorted, allTokensMetadata, assetsSortPredicate]
    );

    const contentElement = useMemo(
      () => (
        <div className={WRAPPER_CLASSNAME}>
          {displayedSlugs.map((slug, i, arr) => {
            const last = i === arr.length - 1;
            const status = collectibles.find(t => t.slug === slug)!.status;

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
      ),
      [collectibles, displayedSlugs, removeItem, toggleTokenStatus]
    );

    return (
      <ManageAssetsContent ofCollectibles={true} searchValue={searchValue} setSearchValue={setSearchValue}>
        {displayedSlugs.length === 0 ? (
          <AssetsPlaceholder ofCollectibles={true} isInSearch={isInSearch} isLoading={isSyncing} />
        ) : (
          <>
            {isInSearch ? (
              contentElement
            ) : (
              <InfiniteScroll
                // For non-array children this must be `true`
                hasChildren={true}
                hasMore={true}
                // Used only to determine, whether to call `next` on next scroll-to-end event.
                // Need to update artificially, over cases of `next` calls throwing error
                // and not changing `displayedSlugs.length`.
                dataLength={loadNextSeed}
                next={loadNext}
                // `InfiniteScroll`'s loader conditions r not suited here
                loader={null}
                scrollThreshold={0.95}
              >
                {contentElement}
              </InfiniteScroll>
            )}

            {isSyncing && <SyncSpinner className="mt-6" />}
          </>
        )}
      </ManageAssetsContent>
    );
  }
);
