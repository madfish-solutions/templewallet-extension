import React, { memo, useMemo } from 'react';

import { SyncSpinner } from 'app/atoms';
import { useTokensListingLogic } from 'app/hooks/use-tokens-listing-logic';
import { useAreAssetsLoading } from 'app/store/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tokens-metadata/selectors';
import { TEMPLE_TOKEN_SLUG } from 'lib/assets';
import { useAllAvailableTokens } from 'lib/assets/hooks';
import { useGetTokenMetadata } from 'lib/metadata';
import { useAccount, useChainId } from 'lib/temple/front';
import { isSearchStringApplicable } from 'lib/utils/search-items';

import { AssetsPlaceholder } from './AssetsPlaceholder';
import { ManageAssetsContent, ManageAssetsContentList } from './ManageAssetsContent';

export const ManageTokens = memo(() => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();

  const tokens = useAllAvailableTokens(publicKeyHash, chainId);

  const managebleSlugs = useMemo(
    () => tokens.reduce<string[]>((acc, { slug }) => (slug === TEMPLE_TOKEN_SLUG ? acc : acc.concat(slug)), []),
    [tokens]
  );

  const assetsAreLoading = useAreAssetsLoading('tokens');
  const metadatasLoading = useTokensMetadataLoadingSelector();
  const isSyncing = assetsAreLoading || metadatasLoading;

  const { filteredAssets, searchValue, setSearchValue } = useTokensListingLogic(managebleSlugs, false);

  const isInSearchMode = isSearchStringApplicable(searchValue);

  const displayedAssets = useMemo(
    () => filteredAssets.map(slug => ({ slug, status: tokens.find(t => t.slug === slug)!.status })),
    [filteredAssets, tokens]
  );

  const getMetadata = useGetTokenMetadata();

  return (
    <ManageAssetsContent searchValue={searchValue} setSearchValue={setSearchValue}>
      {filteredAssets.length === 0 ? (
        <AssetsPlaceholder isInSearchMode={isInSearchMode} isLoading={isSyncing} />
      ) : (
        <>
          <ManageAssetsContentList assets={displayedAssets} getMetadata={getMetadata} />

          {isSyncing && <SyncSpinner className="mt-6" />}
        </>
      )}
    </ManageAssetsContent>
  );
});
