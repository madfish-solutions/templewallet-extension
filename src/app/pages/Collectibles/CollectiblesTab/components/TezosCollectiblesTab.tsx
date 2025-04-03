import React, { FC, memo, useMemo } from 'react';

import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import {
  useTezosAccountCollectiblesForListing,
  useTezosAccountCollectiblesListingLogic
} from 'app/hooks/listing-logic/use-tezos-account-collectibles-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useTezosMainnetChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { TezosCollectibleItem } from './CollectibleItem';
import { CollectiblesTabBase } from './CollectiblesTabBase';

interface Props {
  publicKeyHash: string;
}

export const TezosCollectiblesTab = memo<Props>(({ publicKeyHash }) => {
  const { manageActive } = useAssetsViewState();

  if (manageActive) return <TabContentWithManageActive publicKeyHash={publicKeyHash} />;

  return <TabContent publicKeyHash={publicKeyHash} />;
});

const TabContent: FC<Props> = ({ publicKeyHash }) => {
  const { enabledChainSlugsSorted } = useTezosAccountCollectiblesForListing(publicKeyHash);

  return <TabContentBase publicKeyHash={publicKeyHash} allSlugsSorted={enabledChainSlugsSorted} manageActive={false} />;
};

const TabContentWithManageActive: FC<Props> = ({ publicKeyHash }) => {
  const { enabledChainSlugsSorted, allAccountCollectibles, sortPredicate } =
    useTezosAccountCollectiblesForListing(publicKeyHash);

  const allChainSlugsSorted = useMemoWithCompare(
    () =>
      allAccountCollectibles
        .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.Tezos, chainId, slug))
        .sort(sortPredicate),
    [allAccountCollectibles, sortPredicate]
  );

  const allSlugsSorted = usePreservedOrderSlugsToManage(enabledChainSlugsSorted, allChainSlugsSorted);

  return <TabContentBase publicKeyHash={publicKeyHash} allSlugsSorted={allSlugsSorted} manageActive={true} />;
};

interface TabContentBaseProps {
  publicKeyHash: string;
  allSlugsSorted: string[];
  manageActive: boolean;
}

const TabContentBase = memo<TabContentBaseProps>(({ publicKeyHash, allSlugsSorted, manageActive }) => {
  const mainnetChain = useTezosMainnetChain();

  const { isInSearchMode, displayedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
    useTezosAccountCollectiblesListingLogic(allSlugsSorted);

  const { blur, showInfo } = useCollectiblesListOptionsSelector();

  const contentElement = useMemo(
    () => (
      <div className={manageActive ? undefined : 'grid grid-cols-3 gap-1'}>
        {displayedSlugs.map(chainSlug => {
          const [_, chainId, slug] = parseChainAssetSlug(chainSlug, TempleChainKind.Tezos);

          return (
            <TezosCollectibleItem
              key={chainSlug}
              assetSlug={slug}
              accountPkh={publicKeyHash}
              tezosChainId={chainId}
              adultBlur={blur}
              areDetailsShown={showInfo}
              manageActive={manageActive}
            />
          );
        })}
      </div>
    ),
    [displayedSlugs, publicKeyHash, blur, showInfo, manageActive]
  );

  return (
    <CollectiblesTabBase
      collectiblesCount={displayedSlugs.length}
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
