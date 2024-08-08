import React, { FC, memo, useMemo } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import { useTezosChainCollectiblesListingLogic } from 'app/hooks/listing-logic/use-tezos-chain-collectibles-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useTezosChainAccountCollectibles } from 'lib/assets/hooks/collectibles';
import { useTezosChainCollectiblesSortPredicate } from 'lib/assets/use-sorting';
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

  const { blur, showInfo } = useCollectiblesListOptionsSelector();

  const { enabledSlugsSorted } = useEnabledSlugsSorted(publicKeyHash, chainId);

  const { isInSearchMode, displayedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
    useTezosChainCollectiblesListingLogic(enabledSlugsSorted, network);

  const contentElement = useMemo(
    () => (
      <div className="grid grid-cols-3 gap-2">
        {displayedSlugs.map(slug => (
          <TezosCollectibleItem
            key={slug}
            assetSlug={slug}
            accountPkh={publicKeyHash}
            tezosChainId={chainId}
            adultBlur={blur}
            areDetailsShown={showInfo}
            hideWithoutMeta={isInSearchMode}
            manageActive={false}
          />
        ))}
      </div>
    ),
    [displayedSlugs, publicKeyHash, chainId, blur, showInfo, isInSearchMode]
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
};

const TabContentWithManageActive: FC<TabContentProps> = ({ network, publicKeyHash }) => {
  const { chainId } = network;

  const { blur, showInfo } = useCollectiblesListOptionsSelector();

  const { enabledSlugsSorted, allChainAccountCollectibles, sortPredicate } = useEnabledSlugsSorted(
    publicKeyHash,
    chainId
  );

  const allSlugsSorted = useMemoWithCompare(
    () => allChainAccountCollectibles.map(({ slug }) => slug).sort(sortPredicate),
    [allChainAccountCollectibles, sortPredicate]
  );

  const slugsSorted = usePreservedOrderSlugsToManage(enabledSlugsSorted, allSlugsSorted);

  const { isInSearchMode, displayedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
    useTezosChainCollectiblesListingLogic(slugsSorted, network);

  const contentElement = useMemo(
    () => (
      <div>
        {displayedSlugs.map(slug => (
          <TezosCollectibleItem
            key={slug}
            assetSlug={slug}
            accountPkh={publicKeyHash}
            tezosChainId={chainId}
            adultBlur={blur}
            areDetailsShown={showInfo}
            hideWithoutMeta={isInSearchMode}
            manageActive={true}
          />
        ))}
      </div>
    ),
    [displayedSlugs, publicKeyHash, chainId, blur, showInfo, isInSearchMode]
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
};

const useEnabledSlugsSorted = (publicKeyHash: string, chainId: string) => {
  const sortPredicate = useTezosChainCollectiblesSortPredicate(publicKeyHash, chainId);

  const allChainAccountCollectibles = useTezosChainAccountCollectibles(publicKeyHash, chainId);

  const enabledSlugsSorted = useMemoWithCompare(
    () =>
      allChainAccountCollectibles
        .filter(({ status }) => status === 'enabled')
        .map(({ slug }) => slug)
        .sort(sortPredicate),
    [allChainAccountCollectibles, sortPredicate]
  );

  return {
    enabledSlugsSorted,
    allChainAccountCollectibles,
    sortPredicate
  };
};
