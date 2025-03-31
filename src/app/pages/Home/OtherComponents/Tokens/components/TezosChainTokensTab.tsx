import React, { FC, memo, useMemo } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import {
  useTezosChainAccountTokensForListing,
  useTezosChainAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-tezos-chain-account-tokens-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TezosChain, useTezosChainByChainId } from 'temple/front';

import { getTokensViewWithPromo } from '../utils';

import { TezosListItem } from './ListItem';
import { TokensTabBase } from './TokensTabBase';

interface Props {
  chainId: string;
  publicKeyHash: string;
}

export const TezosChainTokensTab = memo<Props>(({ chainId, publicKeyHash }) => {
  const network = useTezosChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const { manageActive } = useAssetsViewState();

  if (manageActive) return <TabContentWithManageActive publicKeyHash={publicKeyHash} network={network} />;

  return <TabContent publicKeyHash={publicKeyHash} network={network} />;
});

interface TabContentProps {
  publicKeyHash: string;
  network: TezosChain;
}

const TabContent: FC<TabContentProps> = ({ publicKeyHash, network }) => {
  const { chainId } = network;

  const { enabledTokenSlugsSorted } = useTezosChainAccountTokensForListing(publicKeyHash, chainId);

  return (
    <TabContentBase
      network={network}
      publicKeyHash={publicKeyHash}
      allSlugsSorted={enabledTokenSlugsSorted}
      manageActive={false}
    />
  );
};

const TabContentWithManageActive: FC<TabContentProps> = ({ publicKeyHash, network }) => {
  const { chainId } = network;

  const { enabledTokenSlugsSorted, tokens, tokensSortPredicate } = useTezosChainAccountTokensForListing(
    publicKeyHash,
    chainId
  );

  const allTokensSlugs = useMemo(
    () => tokens.filter(({ status }) => status !== 'removed').map(({ slug }) => slug),
    [tokens]
  );

  const allTokensSlugsSorted = useMemoWithCompare(
    () => allTokensSlugs.sort(tokensSortPredicate),
    [allTokensSlugs, tokensSortPredicate]
  );

  const allSlugsSorted = usePreservedOrderSlugsToManage(enabledTokenSlugsSorted, allTokensSlugsSorted);

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
  network: TezosChain;
  publicKeyHash: string;
  allSlugsSorted: string[];
  manageActive: boolean;
}

const TabContentBase = memo<TabContentBaseProps>(({ allSlugsSorted, network, publicKeyHash, manageActive }) => {
  const { chainId } = network;

  const { displayedSlugs, isSyncing, loadNext, searchValue, isInSearchMode, setSearchValue } =
    useTezosChainAccountTokensListingLogic(allSlugsSorted, chainId);

  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

  const tokensView = useMemo(() => {
    const tokensJsx = displayedSlugs.map(assetSlug => (
      <TezosListItem
        key={assetSlug}
        network={network}
        publicKeyHash={publicKeyHash}
        assetSlug={assetSlug}
        scam={mainnetTokensScamSlugsRecord[assetSlug]}
        manageActive={manageActive}
      />
    ));

    if (manageActive) return tokensJsx;

    const promoJsx = (
      <PartnersPromotion
        id="promo-token-item"
        key="promo-token-item"
        variant={PartnersPromotionVariant.Text}
        pageName="Token page"
      />
    );

    return getTokensViewWithPromo(tokensJsx, promoJsx);
  }, [network, displayedSlugs, publicKeyHash, mainnetTokensScamSlugsRecord, manageActive]);

  return (
    <TokensTabBase
      tokensCount={displayedSlugs.length}
      searchValue={searchValue}
      loadNextPage={loadNext}
      onSearchValueChange={setSearchValue}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      network={network}
    >
      {tokensView}
    </TokensTabBase>
  );
});
