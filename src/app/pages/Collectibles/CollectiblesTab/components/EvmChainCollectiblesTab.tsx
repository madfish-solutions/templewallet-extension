import React, { memo, useMemo } from 'react';

import { useEvmChainCollectiblesListingLogic } from 'app/hooks/listing-logic/use-evm-chain-collectibles-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useEvmChainByChainId } from 'temple/front/chains';

import { GRID_CLASSNAMES } from '../constants';

import { EvmCollectibleItem } from './CollectibleItem';
import { CollectiblesTabBase } from './CollectiblesTabBase';
import { useEvmCollectiblesMetadataLoading } from './evm-meta-loading';

interface EvmChainCollectiblesTabProps {
  chainId: number;
  publicKeyHash: HexString;
}

export const EvmChainCollectiblesTab = memo<EvmChainCollectiblesTabProps>(({ chainId, publicKeyHash }) => {
  const network = useEvmChainByChainId(chainId);

  const { showInfo } = useCollectiblesListOptionsSelector();
  const { manageActive } = useAssetsViewState();

  const { isInSearchMode, paginatedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
    useEvmChainCollectiblesListingLogic(publicKeyHash, chainId, manageActive);

  useEvmCollectiblesMetadataLoading(publicKeyHash);

  const contentElement = useMemo(
    () => (
      <div className={manageActive ? undefined : GRID_CLASSNAMES}>
        {paginatedSlugs.map(slug => (
          <EvmCollectibleItem
            key={slug}
            assetSlug={slug}
            evmChainId={chainId}
            accountPkh={publicKeyHash}
            showDetails={showInfo}
            manageActive={manageActive}
          />
        ))}
      </div>
    ),
    [chainId, manageActive, paginatedSlugs, publicKeyHash, showInfo]
  );

  return (
    <CollectiblesTabBase
      collectiblesCount={paginatedSlugs.length}
      searchValue={searchValue}
      loadNextPage={loadNext}
      onSearchValueChange={setSearchValue}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      network={network}
    >
      {contentElement}
    </CollectiblesTabBase>
  );
});
