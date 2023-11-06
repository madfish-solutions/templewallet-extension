import React, { memo, useMemo } from 'react';

import { isEqual } from 'lodash';

import { SyncSpinner } from 'app/atoms';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useCollectiblesListingLogic } from 'app/hooks/use-collectibles-listing-logic';
import { useAccountCollectibles } from 'lib/assets/hooks';
import { useCollectiblesSortPredicate } from 'lib/assets/use-filtered';
import { useMemoWithCompare } from 'lib/ui/hooks';

import { AssetsPlaceholder } from './AssetsPlaceholder';
import { ListItem } from './ListItem';
import { WRAPPER_CLASSNAME, ManageAssetsContent } from './ManageAssetsContent';
import { ManageAssetsCommonProps } from './utils';

export const ManageCollectibles = memo<ManageAssetsCommonProps>(
  ({ chainId, publicKeyHash, removeItem, toggleTokenStatus }) => {
    const collectibles = useAccountCollectibles(publicKeyHash, chainId);

    const assetsSortPredicate = useCollectiblesSortPredicate();

    const allSlugsSorted = useMemoWithCompare(
      () => collectibles.map(c => c.slug).sort(assetsSortPredicate),
      [collectibles, assetsSortPredicate],
      isEqual
    );

    const { isInSearchMode, displayedSlugs, isSyncing, loadNext, seedForLoadNext, searchValue, setSearchValue } =
      useCollectiblesListingLogic(allSlugsSorted);

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
          <AssetsPlaceholder ofCollectibles={true} isInSearchMode={isInSearchMode} isLoading={isSyncing} />
        ) : (
          <>
            {isInSearchMode ? (
              contentElement
            ) : (
              <SimpleInfiniteScroll loadNext={loadNext} seedForLoadNext={seedForLoadNext}>
                {contentElement}
              </SimpleInfiniteScroll>
            )}

            {isSyncing && <SyncSpinner className="mt-6" />}
          </>
        )}
      </ManageAssetsContent>
    );
  }
);
