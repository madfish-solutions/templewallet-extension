import React, { FC, memo, useCallback } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import {
  useTezosChainCollectiblesForListing,
  useTezosChainCollectiblesListingLogic
} from 'app/hooks/listing-logic/use-tezos-chain-collectibles-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { CollectiblesListItemElement } from 'lib/ui/collectibles-list';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TezosChain, useTezosChainByChainId } from 'temple/front';

import { TezosCollectibleItem } from './CollectibleItem';
import { TabContentBaseBody } from './tab-content-base-body';

interface Props {
  chainId: string;
  publicKeyHash: string;
  onTokensTabClick: EmptyFn;
  onCollectiblesTabClick: EmptyFn;
}

export const TezosChainCollectiblesTab = memo<Props>(({
  chainId,
  publicKeyHash,
  onTokensTabClick,
  onCollectiblesTabClick
}) => {
  const network = useTezosChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const { manageActive } = useAssetsViewState();

  if (manageActive)
    return (
      <TabContentWithManageActive
        publicKeyHash={publicKeyHash}
        network={network}
        onTokensTabClick={onTokensTabClick}
        onCollectiblesTabClick={onCollectiblesTabClick}
      />
    );

  return (
    <TabContent
      publicKeyHash={publicKeyHash}
      network={network}
      onTokensTabClick={onTokensTabClick}
      onCollectiblesTabClick={onCollectiblesTabClick}
    />
  );
});

interface TabContentProps {
  network: TezosChain;
  publicKeyHash: string;
  onTokensTabClick: EmptyFn;
  onCollectiblesTabClick: EmptyFn;
}

const TabContent: FC<TabContentProps> = ({ network, publicKeyHash, onTokensTabClick, onCollectiblesTabClick }) => {
  const { chainId } = network;

  const { enabledSlugsSorted } = useTezosChainCollectiblesForListing(publicKeyHash, chainId);

  return (
    <TabContentBase
      network={network}
      publicKeyHash={publicKeyHash}
      allSlugsSorted={enabledSlugsSorted}
      manageActive={false}
      onTokensTabClick={onTokensTabClick}
      onCollectiblesTabClick={onCollectiblesTabClick}
    />
  );
};

const TabContentWithManageActive: FC<TabContentProps> = ({
  network,
  publicKeyHash,
  onTokensTabClick,
  onCollectiblesTabClick
}) => {
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
      onTokensTabClick={onTokensTabClick}
      onCollectiblesTabClick={onCollectiblesTabClick}
    />
  );
};

interface TabContentBaseProps {
  network: TezosChain;
  publicKeyHash: string;
  allSlugsSorted: string[];
  manageActive: boolean;
  onTokensTabClick: EmptyFn;
  onCollectiblesTabClick: EmptyFn;
}

const TabContentBase = memo<TabContentBaseProps>(({
  network,
  publicKeyHash,
  allSlugsSorted,
  manageActive,
  onTokensTabClick,
  onCollectiblesTabClick
}) => {
  const { isInSearchMode, displayedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
    useTezosChainCollectiblesListingLogic(allSlugsSorted, network);
  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

  const { chainId } = network;
  const { blur, showInfo } = useCollectiblesListOptionsSelector();

  const renderItem = useCallback(
    (slug: string, index: number, ref?: React.RefObject<CollectiblesListItemElement>) => (
      <TezosCollectibleItem
        key={slug}
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
    ),
    [blur, chainId, mainnetTokensScamSlugsRecord, manageActive, publicKeyHash, showInfo]
  );

  return (
    <TabContentBaseBody
      searchValue={searchValue}
      loadNextPage={loadNext}
      onSearchValueChange={setSearchValue}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      manageActive={manageActive}
      slugs={displayedSlugs}
      showInfo={showInfo}
      renderItem={renderItem}
      network={network}
      onTokensTabClick={onTokensTabClick}
      onCollectiblesTabClick={onCollectiblesTabClick}
    />
  );
});
