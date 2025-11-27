import React, { FC, memo, useCallback } from 'react';

import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import {
  useTezosAccountCollectiblesForListing,
  useTezosAccountCollectiblesListingLogic
} from 'app/hooks/listing-logic/use-tezos-account-collectibles-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { CollectiblesListItemElement } from 'lib/ui/collectibles-list';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useTezosMainnetChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { TezosCollectibleItem } from './CollectibleItem';
import { TabContentBaseBody } from './tab-content-base-body';

interface Props {
  publicKeyHash: string;
  onTokensTabClick: EmptyFn;
  onCollectiblesTabClick: EmptyFn;
}

export const TezosCollectiblesTab = memo<Props>(({ publicKeyHash, onTokensTabClick, onCollectiblesTabClick }) => {
  const { manageActive } = useAssetsViewState();

  if (manageActive)
    return (
      <TabContentWithManageActive
        publicKeyHash={publicKeyHash}
        onTokensTabClick={onTokensTabClick}
        onCollectiblesTabClick={onCollectiblesTabClick}
      />
    );

  return (
    <TabContent
      publicKeyHash={publicKeyHash}
      onTokensTabClick={onTokensTabClick}
      onCollectiblesTabClick={onCollectiblesTabClick}
    />
  );
});

const TabContent: FC<Props> = ({ publicKeyHash, onTokensTabClick, onCollectiblesTabClick }) => {
  const { enabledChainSlugsSorted } = useTezosAccountCollectiblesForListing(publicKeyHash);

  return (
    <TabContentBase
      publicKeyHash={publicKeyHash}
      allSlugsSorted={enabledChainSlugsSorted}
      manageActive={false}
      onTokensTabClick={onTokensTabClick}
      onCollectiblesTabClick={onCollectiblesTabClick}
    />
  );
};

const TabContentWithManageActive: FC<Props> = ({ publicKeyHash, onTokensTabClick, onCollectiblesTabClick }) => {
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

  return (
    <TabContentBase
      publicKeyHash={publicKeyHash}
      allSlugsSorted={allSlugsSorted}
      manageActive={true}
      onTokensTabClick={onTokensTabClick}
      onCollectiblesTabClick={onCollectiblesTabClick}
    />
  );
};

interface TabContentBaseProps {
  publicKeyHash: string;
  allSlugsSorted: string[];
  manageActive: boolean;
  onTokensTabClick: EmptyFn;
  onCollectiblesTabClick: EmptyFn;
}

const TabContentBase = memo<TabContentBaseProps>(({
  publicKeyHash,
  allSlugsSorted,
  manageActive,
  onTokensTabClick,
  onCollectiblesTabClick
}) => {
  const mainnetChain = useTezosMainnetChain();
  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

  const { isInSearchMode, displayedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
    useTezosAccountCollectiblesListingLogic(allSlugsSorted);

  const { blur, showInfo } = useCollectiblesListOptionsSelector();

  const renderItem = useCallback(
    (chainSlug: string, index: number, ref?: React.RefObject<CollectiblesListItemElement>) => {
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
          scam={mainnetTokensScamSlugsRecord[slug]}
          index={index}
          ref={ref}
        />
      );
    },
    [blur, mainnetTokensScamSlugsRecord, manageActive, publicKeyHash, showInfo]
  );

  return (
    <TabContentBaseBody
      searchValue={searchValue}
      loadNextPage={loadNext}
      onSearchValueChange={setSearchValue}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      network={mainnetChain}
      manageActive={manageActive}
      slugs={displayedSlugs}
      showInfo={showInfo}
      renderItem={renderItem}
      onTokensTabClick={onTokensTabClick}
      onCollectiblesTabClick={onCollectiblesTabClick}
    />
  );
});
