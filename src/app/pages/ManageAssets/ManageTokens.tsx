import React, { memo, useMemo } from 'react';

import { useTokensListingLogic } from 'app/hooks/use-tokens-listing-logic';
import { useAreAssetsLoading } from 'app/store/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tokens-metadata/selectors';
import { TEMPLE_TOKEN_SLUG } from 'lib/assets';
import { useAllAvailableTokens } from 'lib/assets/hooks';
import { useGetTokenMetadata } from 'lib/metadata';
import { isSearchStringApplicable } from 'lib/utils/search-items';

import { AssetsPlaceholder } from './AssetsPlaceholder';
import { ListItem } from './ListItem';
import { WRAPPER_CLASSNAME, ManageAssetsContent } from './ManageAssetsContent';
import { ManageAssetsCommonProps } from './utils';

export const ManageTokens = memo<ManageAssetsCommonProps>(
  ({ chainId, publicKeyHash, removeItem, toggleTokenStatus }) => {
    const tokens = useAllAvailableTokens(publicKeyHash, chainId);

    const managebleSlugs = useMemo(
      () => tokens.reduce<string[]>((acc, { slug }) => (slug === TEMPLE_TOKEN_SLUG ? acc : acc.concat(slug)), []),
      [tokens]
    );

    const assetsAreLoading = useAreAssetsLoading('tokens');
    const metadatasLoading = useTokensMetadataLoadingSelector();
    const isLoading = assetsAreLoading || metadatasLoading;

    const { filteredAssets, searchValue, setSearchValue } = useTokensListingLogic(managebleSlugs, false);

    const isInSearchMode = isSearchStringApplicable(searchValue);

    const getMetadata = useGetTokenMetadata();

    return (
      <ManageAssetsContent ofCollectibles={false} searchValue={searchValue} setSearchValue={setSearchValue}>
        {filteredAssets.length === 0 ? (
          <AssetsPlaceholder isInSearchMode={isInSearchMode} isLoading={isLoading} />
        ) : (
          <div className={WRAPPER_CLASSNAME}>
            {filteredAssets.map((slug, i, arr) => {
              const metadata = getMetadata(slug);

              const last = i === arr.length - 1;
              const status = tokens.find(t => t.slug === slug)!.status;

              return (
                <ListItem
                  key={slug}
                  assetSlug={slug}
                  metadata={metadata}
                  last={last}
                  checked={status === 'enabled'}
                  onRemove={removeItem}
                  onToggle={toggleTokenStatus}
                />
              );
            })}
          </div>
        )}
      </ManageAssetsContent>
    );
  }
);
