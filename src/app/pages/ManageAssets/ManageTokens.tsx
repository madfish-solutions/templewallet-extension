import React, { memo, useMemo } from 'react';

import { useAreAssetsLoading } from 'app/store/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tokens-metadata/selectors';
import { TEMPLE_TOKEN_SLUG } from 'lib/assets';
import { useAllAvailableTokens } from 'lib/assets/hooks';
import { useFilteredAssetsSlugs } from 'lib/assets/use-filtered';

import { ListItem } from './ListItem';
import { Loader } from './Loader';
import { WRAPPER_CLASSNAME, ManageAssetsContent } from './ManageAssetsContent';
import { ManageAssetsCommonProps } from './utils';

export const ManageTokens = memo<ManageAssetsCommonProps>(
  ({ chainId, publicKeyHash, removeItem, toggleTokenStatus }) => {
    const tokens = useAllAvailableTokens(publicKeyHash, chainId);

    const managebleSlugs = useMemo(
      () => tokens.reduce<string[]>((acc, { slug }) => (slug === TEMPLE_TOKEN_SLUG ? acc : acc.concat(slug)), []),
      [tokens]
    );
    const slugs = managebleSlugs;

    const assetsAreLoading = useAreAssetsLoading('tokens');
    const metadatasLoading = useTokensMetadataLoadingSelector();
    const isLoading = assetsAreLoading || metadatasLoading;

    const { filteredAssets, searchValue, setSearchValue } = useFilteredAssetsSlugs(slugs, false);

    return (
      <ManageAssetsContent ofCollectibles={false} searchValue={searchValue} setSearchValue={setSearchValue}>
        {filteredAssets.length > 0 ? (
          <div className={WRAPPER_CLASSNAME}>
            {filteredAssets.map((slug, i, arr) => {
              const last = i === arr.length - 1;
              const status = tokens.find(t => t.slug === slug)!.status;

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
        ) : (
          isLoading || <Loader searchActive={Boolean(searchValue)} />
        )}
      </ManageAssetsContent>
    );
  }
);
