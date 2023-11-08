import React, { memo, useMemo } from 'react';

import { isEqual } from 'lodash';

import { SyncSpinner } from 'app/atoms';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useCollectiblesListingLogic } from 'app/hooks/use-collectibles-listing-logic';
import { useAccountCollectibles } from 'lib/assets/hooks';
import { useCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useGetCollectibleMetadata } from 'lib/metadata';
import { useAccount, useChainId } from 'lib/temple/front';
import { useMemoWithCompare } from 'lib/ui/hooks';

import { AssetsPlaceholder } from './AssetsPlaceholder';
import { ManageAssetsContent, ManageAssetsContentList } from './ManageAssetsContent';

export const ManageCollectibles = memo(() => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();

  const collectibles = useAccountCollectibles(publicKeyHash, chainId);

  const assetsSortPredicate = useCollectiblesSortPredicate();

  const allSlugsSorted = useMemoWithCompare(
    () => collectibles.map(c => c.slug).sort(assetsSortPredicate),
    [collectibles, assetsSortPredicate],
    isEqual
  );

  const { isInSearchMode, displayedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
    useCollectiblesListingLogic(allSlugsSorted);

  const displayedAssets = useMemo(
    () => displayedSlugs.map(slug => ({ slug, status: collectibles.find(t => t.slug === slug)!.status })),
    [displayedSlugs, collectibles]
  );

  const getMetadata = useGetCollectibleMetadata();

  const contentElement = (
    <ManageAssetsContentList ofCollectibles={true} assets={displayedAssets} getMetadata={getMetadata} />
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
            <SimpleInfiniteScroll loadNext={loadNext}>{contentElement}</SimpleInfiniteScroll>
          )}

          {isSyncing && <SyncSpinner className="mt-6" />}
        </>
      )}
    </ManageAssetsContent>
  );
});
