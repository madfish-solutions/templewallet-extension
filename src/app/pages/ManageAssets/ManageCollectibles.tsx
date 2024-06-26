import React, { memo, useMemo } from 'react';

import { isEqual } from 'lodash';

import { SyncSpinner } from 'app/atoms';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useTezosChainCollectiblesListingLogic } from 'app/hooks/use-collectibles-listing-logic';
import { useTezosChainAccountCollectibles } from 'lib/assets/hooks';
import { useTezosChainCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useGetCollectibleMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TezosNetworkEssentials } from 'temple/networks';

import { AssetsPlaceholder } from './AssetsPlaceholder';
import { ManageAssetsContent, ManageAssetsContentList } from './ManageAssetsContent';

interface Props {
  network: TezosNetworkEssentials;
  publicKeyHash: string;
}

export const ManageTezosCollectibles = memo<Props>(({ network, publicKeyHash }) => {
  const collectibles = useTezosChainAccountCollectibles(publicKeyHash, network.chainId);

  const assetsSortPredicate = useTezosChainCollectiblesSortPredicate(publicKeyHash, network.chainId);

  const allSlugsSorted = useMemoWithCompare(
    () => collectibles.map(c => c.slug).sort(assetsSortPredicate),
    [collectibles, assetsSortPredicate],
    isEqual
  );

  const { isInSearchMode, displayedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
    useTezosChainCollectiblesListingLogic(network, allSlugsSorted);

  const displayedAssets = useMemo(
    () => displayedSlugs.map(slug => ({ slug, status: collectibles.find(t => t.slug === slug)!.status })),
    [displayedSlugs, collectibles]
  );

  const getMetadata = useGetCollectibleMetadata();

  const contentElement = (
    <ManageAssetsContentList
      tezosChainId={network.chainId}
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
