import React, { memo, useMemo } from 'react';

import { useAreAssetsLoading } from 'app/store/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tokens-metadata/selectors';
import { useAccountCollectibles } from 'lib/assets/hooks';
import { useFilteredAssetsSlugs } from 'lib/assets/use-filtered';

import { ListItem } from './ListItem';
import { Loader } from './Loader';
import { WRAPPER_CLASSNAME, ManageAssetsContent } from './ManageAssetsContent';
import { ManageAssetsCommonProps } from './utils';

export const ManageCollectibles = memo<ManageAssetsCommonProps>(
  ({ chainId, publicKeyHash, removeItem, toggleTokenStatus }) => {
    const collectibles = useAccountCollectibles(publicKeyHash, chainId);

    const slugs = useMemo(() => collectibles.map(c => c.slug), [collectibles]);

    const assetsAreLoading = useAreAssetsLoading('collectibles');
    const metadatasLoading = useTokensMetadataLoadingSelector();
    const isLoading = assetsAreLoading || metadatasLoading;

    const { filteredAssets, searchValue, setSearchValue } = useFilteredAssetsSlugs(slugs, false);

    return (
      <ManageAssetsContent ofCollectibles={true} searchValue={searchValue} setSearchValue={setSearchValue}>
        {filteredAssets.length > 0 ? (
          <div className={WRAPPER_CLASSNAME}>
            {filteredAssets.map((slug, i, arr) => {
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
        ) : (
          isLoading || <Loader ofCollectibles={true} searchActive={Boolean(searchValue)} />
        )}
      </ManageAssetsContent>
    );
  }
);
