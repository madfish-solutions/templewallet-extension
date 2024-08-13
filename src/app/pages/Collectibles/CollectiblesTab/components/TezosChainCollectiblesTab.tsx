import React, { FC, memo, useMemo } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import {
  useTezosChainCollectiblesForListing,
  useTezosChainCollectiblesListingLogic
} from 'app/hooks/listing-logic/use-tezos-chain-collectibles-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useTezosChainByChainId } from 'temple/front';
import { TezosNetworkEssentials } from 'temple/networks';

import { TezosCollectibleItem } from './CollectibleItem';
import { CollectiblesTabBase } from './CollectiblesTabBase';

interface Props {
  chainId: string;
  publicKeyHash: string;
}

export const TezosChainCollectiblesTab = memo<Props>(({ chainId, publicKeyHash }) => {
  const network = useTezosChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const { manageActive } = useAssetsViewState();

  if (manageActive) return <TabContentWithManageActive publicKeyHash={publicKeyHash} network={network} />;

  return <TabContent publicKeyHash={publicKeyHash} network={network} />;
});

interface TabContentProps {
  network: TezosNetworkEssentials;
  publicKeyHash: string;
}

const TabContent: FC<TabContentProps> = ({ network, publicKeyHash }) => {
  const { chainId } = network;

  const { enabledSlugsSorted } = useTezosChainCollectiblesForListing(publicKeyHash, chainId);

  return (
    <TabContentBase
      network={network}
      publicKeyHash={publicKeyHash}
      allSlugsSorted={enabledSlugsSorted}
      manageActive={false}
    />
  );
};

const TabContentWithManageActive: FC<TabContentProps> = ({ network, publicKeyHash }) => {
  const { chainId } = network;

  const { enabledSlugsSorted, allChainAccountCollectibles, sortPredicate } = useTezosChainCollectiblesForListing(
    publicKeyHash,
    chainId
  );

  const otherSlugsSorted = useMemoWithCompare(
    () => allChainAccountCollectibles.map(({ slug }) => slug).sort(sortPredicate),
    [allChainAccountCollectibles, sortPredicate]
  );

  const allSlugsSorted = usePreservedOrderSlugsToManage(enabledSlugsSorted, otherSlugsSorted);

  return (
    <TabContentBase
      network={network}
      publicKeyHash={publicKeyHash}
      allSlugsSorted={allSlugsSorted}
      manageActive={true}
    />
  );
};

interface TabContentBaseProps {
  network: TezosNetworkEssentials;
  publicKeyHash: string;
  allSlugsSorted: string[];
  manageActive: boolean;
}

const TabContentBase = memo<TabContentBaseProps>(({ network, publicKeyHash, allSlugsSorted, manageActive }) => {
  const { isInSearchMode, displayedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
    useTezosChainCollectiblesListingLogic(allSlugsSorted, network);

  const { chainId } = network;
  const { blur, showInfo } = useCollectiblesListOptionsSelector();

  const contentElement = useMemo(
    () => (
      <div className={manageActive ? undefined : 'grid grid-cols-3 gap-2'}>
        {displayedSlugs.map(slug => (
          <TezosCollectibleItem
            key={slug}
            assetSlug={slug}
            accountPkh={publicKeyHash}
            tezosChainId={chainId}
            adultBlur={blur}
            areDetailsShown={showInfo}
            manageActive={manageActive}
          />
        ))}
      </div>
    ),
    [displayedSlugs, publicKeyHash, chainId, blur, showInfo, manageActive]
  );

  return (
    <CollectiblesTabBase
      collectiblesCount={displayedSlugs.length}
      searchValue={searchValue}
      loadNextPage={loadNext}
      onSearchValueChange={setSearchValue}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
    >
      {contentElement}
    </CollectiblesTabBase>
  );
});
