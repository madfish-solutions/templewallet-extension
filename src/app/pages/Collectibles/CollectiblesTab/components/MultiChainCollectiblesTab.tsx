import React, { memo, useCallback } from 'react';

import { useAccountCollectiblesListingLogic } from 'app/hooks/listing-logic/use-account-collectibles-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { CollectiblesListItemElement } from 'lib/ui/collectibles-list';
import { TempleChainKind } from 'temple/types';

import { EvmCollectibleItem, TezosCollectibleItem } from './CollectibleItem';
import { useEvmCollectiblesMetadataLoading } from './evm-meta-loading';
import { TabContentBaseBody } from './tab-content-base-body';

interface MultiChainCollectiblesTabProps {
  accountTezAddress: string;
  accountEvmAddress: HexString;
}

export const MultiChainCollectiblesTab = memo<MultiChainCollectiblesTabProps>(
  ({ accountTezAddress, accountEvmAddress }) => {
    const { blur, showInfo } = useCollectiblesListOptionsSelector();
    const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

    const { manageActive } = useAssetsViewState();

    const { isInSearchMode, paginatedSlugs, isSyncing, loadNext } = useAccountCollectiblesListingLogic(
      accountTezAddress,
      accountEvmAddress,
      manageActive
    );

    useEvmCollectiblesMetadataLoading(accountEvmAddress);

    const renderItem = useCallback(
      (chainSlug: string, index: number, ref?: React.RefObject<CollectiblesListItemElement | null>) => {
        const [chainKind, chainId, slug] = parseChainAssetSlug(chainSlug);

        if (chainKind === TempleChainKind.Tezos) {
          return (
            <TezosCollectibleItem
              key={chainSlug}
              assetSlug={slug}
              accountPkh={accountTezAddress}
              tezosChainId={chainId as string}
              adultBlur={blur}
              areDetailsShown={showInfo}
              manageActive={manageActive}
              scam={mainnetTokensScamSlugsRecord[slug]}
              index={index}
              ref={ref}
            />
          );
        }

        return (
          <EvmCollectibleItem
            key={chainSlug}
            assetSlug={slug}
            evmChainId={chainId as number}
            accountPkh={accountEvmAddress}
            showDetails={showInfo}
            manageActive={manageActive}
            index={index}
            ref={ref}
          />
        );
      },
      [accountEvmAddress, accountTezAddress, blur, mainnetTokensScamSlugsRecord, manageActive, showInfo]
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
      />
    );
  }
);
