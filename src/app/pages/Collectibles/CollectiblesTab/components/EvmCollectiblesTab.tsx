import React, { memo, useCallback } from 'react';

import { useEvmAccountCollectiblesListingLogic } from 'app/hooks/listing-logic/use-evm-account-collectibles-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { CollectiblesListItemElement } from 'lib/ui/collectibles-list';
import { useEthereumMainnetChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { EvmCollectibleItem } from './CollectibleItem';
import { useEvmCollectiblesMetadataLoading } from './evm-meta-loading';
import { TabContentBaseBody } from './tab-content-base-body';

interface EvmCollectiblesTabProps {
  publicKeyHash: HexString;
}

export const EvmCollectiblesTab = memo<EvmCollectiblesTabProps>(({ publicKeyHash }) => {
  const mainnetChain = useEthereumMainnetChain();

  const { showInfo } = useCollectiblesListOptionsSelector();
  const { manageActive } = useAssetsViewState();

  const { isInSearchMode, paginatedSlugs, isSyncing, loadNext } = useEvmAccountCollectiblesListingLogic(
    publicKeyHash,
    manageActive
  );

  useEvmCollectiblesMetadataLoading(publicKeyHash);

  const renderItem = useCallback(
    (chainSlug: string, index: number, ref?: React.RefObject<CollectiblesListItemElement>) => {
      const [_, chainId, slug] = parseChainAssetSlug(chainSlug, TempleChainKind.EVM);

      return (
        <EvmCollectibleItem
          key={chainSlug}
          assetSlug={slug}
          accountPkh={publicKeyHash}
          evmChainId={chainId}
          showDetails={showInfo}
          manageActive={manageActive}
          index={index}
          ref={ref}
        />
      );
    },
    [manageActive, publicKeyHash, showInfo]
  );

  return (
    <TabContentBaseBody
      loadNextPage={loadNext}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      network={mainnetChain}
      manageActive={manageActive}
      slugs={paginatedSlugs}
      showInfo={showInfo}
      renderItem={renderItem}
    />
  );
});
