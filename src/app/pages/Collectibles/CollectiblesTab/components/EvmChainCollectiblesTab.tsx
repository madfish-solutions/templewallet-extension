import React, { memo, useCallback } from 'react';

import { useEvmChainCollectiblesListingLogic } from 'app/hooks/listing-logic/use-evm-chain-collectibles-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { CollectiblesListItemElement } from 'lib/ui/collectibles-list';
import { useEvmChainByChainId } from 'temple/front/chains';

import { EvmCollectibleItem } from './CollectibleItem';
import { useEvmCollectiblesMetadataLoading } from './evm-meta-loading';
import { TabContentBaseBody } from './tab-content-base-body';

interface EvmChainCollectiblesTabProps {
  chainId: number;
  publicKeyHash: HexString;
}

export const EvmChainCollectiblesTab = memo<EvmChainCollectiblesTabProps>(({ chainId, publicKeyHash }) => {
  const network = useEvmChainByChainId(chainId);

  const { showInfo } = useCollectiblesListOptionsSelector();
  const { manageActive } = useAssetsViewState();

  const { isInSearchMode, paginatedSlugs, isSyncing, loadNext } = useEvmChainCollectiblesListingLogic(
    publicKeyHash,
    chainId,
    manageActive
  );

  useEvmCollectiblesMetadataLoading(publicKeyHash);

  const renderItem = useCallback(
    (slug: string, index: number, ref?: React.RefObject<CollectiblesListItemElement>) => (
      <EvmCollectibleItem
        key={slug}
        assetSlug={slug}
        evmChainId={chainId}
        accountPkh={publicKeyHash}
        showDetails={showInfo}
        manageActive={manageActive}
        index={index}
        ref={ref}
      />
    ),
    [chainId, manageActive, publicKeyHash, showInfo]
  );

  return (
    <TabContentBaseBody
      loadNextPage={loadNext}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      manageActive={manageActive}
      slugs={paginatedSlugs}
      showInfo={showInfo}
      renderItem={renderItem}
      network={network}
    />
  );
});
