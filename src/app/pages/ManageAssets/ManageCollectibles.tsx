import React, { memo, useMemo } from 'react';

import { isEqual } from 'lodash';

import { SyncSpinner } from 'app/atoms';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useCollectiblesListingLogic } from 'app/hooks/use-collectibles-listing-logic';
import { useAccountCollectibles } from 'lib/assets/hooks';
import { useCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useGetCollectibleMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useTezosNetwork } from 'temple/front';

import { AssetsPlaceholder } from './AssetsPlaceholder';
import { ManageAssetsContent, ManageAssetsContentList } from './ManageAssetsContent';

interface Props {
  publicKeyHash: string;
}

export const ManageTezosCollectibles = memo<Props>(({ publicKeyHash }) => {
  const { chainId } = useTezosNetwork();

  const collectibles = useAccountCollectibles(publicKeyHash, chainId);

  const assetsSortPredicate = useCollectiblesSortPredicate(publicKeyHash);

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
    <ManageAssetsContentList
      publicKeyHash={publicKeyHash}
      ofCollectibles={true}
      assets={displayedAssets}
      getMetadata={getMetadata}
    />
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
