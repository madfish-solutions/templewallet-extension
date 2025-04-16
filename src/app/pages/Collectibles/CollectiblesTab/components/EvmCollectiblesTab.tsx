import React, { memo, useMemo } from 'react';

import { useEvmAccountCollectiblesListingLogic } from 'app/hooks/listing-logic/use-evm-account-collectibles-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { fromChainAssetSlug } from 'lib/assets/utils';
import { useEthereumMainnetChain } from 'temple/front';

import { GRID_CLASSNAMES } from '../constants';

import { EvmCollectibleItem } from './CollectibleItem';
import { CollectiblesTabBase } from './CollectiblesTabBase';
import { useEvmCollectiblesMetadataLoading } from './evm-meta-loading';

interface EvmCollectiblesTabProps {
  publicKeyHash: HexString;
}

export const EvmCollectiblesTab = memo<EvmCollectiblesTabProps>(({ publicKeyHash }) => {
  const mainnetChain = useEthereumMainnetChain();

  const { showInfo } = useCollectiblesListOptionsSelector();
  const { manageActive } = useAssetsViewState();

  const { isInSearchMode, paginatedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
    useEvmAccountCollectiblesListingLogic(publicKeyHash, manageActive);

  useEvmCollectiblesMetadataLoading(publicKeyHash);

  const contentElement = useMemo(
    () => (
      <div className={manageActive ? undefined : GRID_CLASSNAMES}>
        {paginatedSlugs.map(chainSlug => {
          const [_, chainId, slug] = fromChainAssetSlug<number>(chainSlug);

          return (
            <EvmCollectibleItem
              key={chainSlug}
              assetSlug={slug}
              evmChainId={chainId}
              accountPkh={publicKeyHash}
              showDetails={showInfo}
              manageActive={manageActive}
            />
          );
        })}
      </div>
    ),
    [manageActive, paginatedSlugs, publicKeyHash, showInfo]
  );

  return (
    <CollectiblesTabBase
      collectiblesCount={paginatedSlugs.length}
      searchValue={searchValue}
      loadNextPage={loadNext}
      onSearchValueChange={setSearchValue}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      network={mainnetChain}
    >
      {contentElement}
    </CollectiblesTabBase>
  );
});
