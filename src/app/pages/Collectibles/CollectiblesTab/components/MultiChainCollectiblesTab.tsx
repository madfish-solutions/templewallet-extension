import React, { memo, useMemo } from 'react';

import { useAccountCollectiblesListingLogic } from 'app/hooks/listing-logic/use-account-collectibles-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { fromChainAssetSlug } from 'lib/assets/utils';
import { TempleChainKind } from 'temple/types';

import { EvmCollectibleItem, TezosCollectibleItem } from './CollectibleItem';
import { CollectiblesTabBase } from './CollectiblesTabBase';
import { useEvmCollectiblesMetadataLoading } from './evm-meta-loading';

interface MultiChainCollectiblesTabProps {
  accountTezAddress: string;
  accountEvmAddress: HexString;
}

export const MultiChainCollectiblesTab = memo<MultiChainCollectiblesTabProps>(
  ({ accountTezAddress, accountEvmAddress }) => {
    const { blur, showInfo } = useCollectiblesListOptionsSelector();

    const { manageActive } = useAssetsViewState();

    const { isInSearchMode, paginatedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
      useAccountCollectiblesListingLogic(accountTezAddress, accountEvmAddress, manageActive);

    useEvmCollectiblesMetadataLoading(accountEvmAddress);

    const contentElement = useMemo(
      () => (
        <div className={manageActive ? undefined : 'grid grid-cols-3 gap-1'}>
          {paginatedSlugs.map(chainSlug => {
            const [chainKind, chainId, slug] = fromChainAssetSlug(chainSlug);

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
              />
            );
          })}
        </div>
      ),
      [accountEvmAddress, accountTezAddress, blur, paginatedSlugs, showInfo, manageActive]
    );

    return (
      <CollectiblesTabBase
        collectiblesCount={paginatedSlugs.length}
        searchValue={searchValue}
        loadNextPage={loadNext}
        onSearchValueChange={setSearchValue}
        isSyncing={isSyncing}
        isInSearchMode={isInSearchMode}
      >
        {contentElement}
      </CollectiblesTabBase>
    );
  }
);
