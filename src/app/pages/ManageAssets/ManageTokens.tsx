import React, { memo, useMemo } from 'react';

import { SyncSpinner } from 'app/atoms';
import { useTezosChainAccountTokensListingLogic } from 'app/hooks/tokens-listing-logic/use-tezos-chain-account-tokens-listing-logic';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { TEMPLE_TOKEN_SLUG } from 'lib/assets';
import { useAllTezosAvailableTokens } from 'lib/assets/hooks';
import { useGetTokenMetadata } from 'lib/metadata';
import { isSearchStringApplicable } from 'lib/utils/search-items';

import { AssetsPlaceholder } from './AssetsPlaceholder';
import { ManageAssetsContent, ManageAssetsContentList } from './ManageAssetsContent';

interface Props {
  tezosChainId: string;
  publicKeyHash: string;
}

export const ManageTezosTokens = memo<Props>(({ tezosChainId, publicKeyHash }) => {
  const tokens = useAllTezosAvailableTokens(publicKeyHash, tezosChainId);

  const managebleSlugs = useMemo(
    () => tokens.reduce<string[]>((acc, { slug }) => (slug === TEMPLE_TOKEN_SLUG ? acc : acc.concat(slug)), []),
    [tokens]
  );

  const assetsAreLoading = useAreAssetsLoading('tokens');
  const metadatasLoading = useTokensMetadataLoadingSelector();
  const isSyncing = assetsAreLoading || metadatasLoading;

  const { filteredAssets, searchValue, setSearchValue } = useTezosChainAccountTokensListingLogic(
    tezosChainId,
    publicKeyHash,
    managebleSlugs,
    false
  );

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
          <ManageAssetsContentList
            tezosChainId={tezosChainId}
            publicKeyHash={publicKeyHash}
            assets={displayedAssets}
            getMetadata={getMetadata}
          />

          {isSyncing && <SyncSpinner className="mt-6" />}
        </>
      )}
    </ManageAssetsContent>
  );
});
