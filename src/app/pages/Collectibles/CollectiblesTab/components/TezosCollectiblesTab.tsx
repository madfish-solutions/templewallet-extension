import React, { FC, memo, useMemo } from 'react';

import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import { useTezosAccountCollectiblesListingLogic } from 'app/hooks/listing-logic/use-tezos-account-collectibles-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useTezosAccountCollectibles } from 'lib/assets/hooks/collectibles';
import { useTezosAccountCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { fromChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
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
  const { blur, showInfo } = useCollectiblesListOptionsSelector();

  const { enabledChainSlugsSorted } = useEnabledSlugsSorted(publicKeyHash);

  const { isInSearchMode, displayedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
    useTezosAccountCollectiblesListingLogic(enabledChainSlugsSorted);

  const contentElement = useMemo(
    () => (
      <div className="grid grid-cols-3 gap-2">
        {displayedSlugs.map(chainSlug => {
          const [_, chainId, slug] = fromChainAssetSlug<string>(chainSlug);

          return (
            <TezosCollectibleItem
              key={chainSlug}
              assetSlug={slug}
              accountPkh={publicKeyHash}
              tezosChainId={chainId}
              adultBlur={blur}
              areDetailsShown={showInfo}
              hideWithoutMeta={isInSearchMode}
              manageActive={false}
            />
          );
        })}
      </div>
    ),
    [displayedSlugs, publicKeyHash, blur, showInfo, isInSearchMode]
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

const TabContentWithManageActive: FC<Props> = ({ publicKeyHash }) => {
  const { blur, showInfo } = useCollectiblesListOptionsSelector();

  const { enabledChainSlugsSorted, allAccountCollectibles, sortPredicate } = useEnabledSlugsSorted(publicKeyHash);

  const allChainSlugsSorted = useMemoWithCompare(
    () =>
      allAccountCollectibles
        .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.Tezos, chainId, slug))
        .sort(sortPredicate),
    [allAccountCollectibles, sortPredicate]
  );

  const slugsSorted = usePreservedOrderSlugsToManage(enabledChainSlugsSorted, allChainSlugsSorted);

  const { isInSearchMode, displayedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
    useTezosAccountCollectiblesListingLogic(slugsSorted);

  const contentElement = useMemo(
    () => (
      <div>
        {displayedSlugs.map(chainSlug => {
          const [_, chainId, slug] = fromChainAssetSlug<string>(chainSlug);

          return (
            <TezosCollectibleItem
              key={chainSlug}
              assetSlug={slug}
              accountPkh={publicKeyHash}
              tezosChainId={chainId}
              adultBlur={blur}
              areDetailsShown={showInfo}
              hideWithoutMeta={isInSearchMode}
              manageActive={true}
            />
          );
        })}
      </div>
    ),
    [displayedSlugs, publicKeyHash, blur, showInfo, isInSearchMode]
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

const useEnabledSlugsSorted = (publicKeyHash: string) => {
  const sortPredicate = useTezosAccountCollectiblesSortPredicate(publicKeyHash);

  const allAccountCollectibles = useTezosAccountCollectibles(publicKeyHash);

  const enabledChainSlugsSorted = useMemoWithCompare(
    () =>
      allAccountCollectibles
        .filter(({ status }) => status === 'enabled')
        .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.Tezos, chainId, slug))
        .sort(sortPredicate),
    [allAccountCollectibles, sortPredicate]
  );

  return {
    enabledChainSlugsSorted,
    allAccountCollectibles,
    sortPredicate
  };
};
