import React, { createContext, FC, memo, useContext, useMemo, useRef } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import {
  useTezosChainAccountTokensForListing,
  useTezosChainAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-tezos-chain-account-tokens-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { TezosTokenListItem } from 'app/templates/TokenListItem';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { makeGetTokenElementIndexFunction, TokenListItemElement } from 'lib/ui/tokens-list';
import { TezosChain, useTezosChainByChainId } from 'temple/front';
import { TEZOS_DEFAULT_NETWORKS } from 'temple/networks';

import { getTokensViewWithPromo, makeFallbackChain } from '../utils';

import { TokensTabBase } from './tokens-tab-base';

interface Props {
  chainId: string;
  publicKeyHash: string;
  accountId: string;
  onTokensTabClick: EmptyFn;
  onCollectiblesTabClick: EmptyFn;
}

const TezosChainTokensTabContext = createContext<Omit<Props, 'chainId'> & { network: TezosChain }>({
  network: makeFallbackChain(TEZOS_DEFAULT_NETWORKS[0]),
  publicKeyHash: '',
  accountId: '',
  onTokensTabClick: () => {},
  onCollectiblesTabClick: () => {}
});

export const TezosChainTokensTab = memo<Props>(({
  chainId,
  accountId,
  publicKeyHash,
  onTokensTabClick,
  onCollectiblesTabClick
}) => {
  const network = useTezosChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const { manageActive } = useAssetsViewState();
  const contextValue = useMemo(
    () => ({ accountId, network, publicKeyHash, onTokensTabClick, onCollectiblesTabClick }),
    [accountId, network, publicKeyHash, onTokensTabClick, onCollectiblesTabClick]
  );

  return (
    <TezosChainTokensTabContext.Provider value={contextValue}>
      {manageActive ? <TabContentWithManageActive /> : <TabContent />}
    </TezosChainTokensTabContext.Provider>
  );
});

const TabContent: FC = () => {
  const { publicKeyHash, network } = useContext(TezosChainTokensTabContext);

  const { enabledTokenSlugsSorted, shouldShowHiddenTokensHint } = useTezosChainAccountTokensForListing(
    publicKeyHash,
    network.chainId
  );

  return (
    <TabContentBase
      manageActive={false}
      allSlugsSorted={enabledTokenSlugsSorted}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
    />
  );
};

const TabContentWithManageActive: FC = () => {
  const { publicKeyHash, network } = useContext(TezosChainTokensTabContext);

  const { enabledTokenSlugsSorted, tokens, tokensSortPredicate } = useTezosChainAccountTokensForListing(
    publicKeyHash,
    network.chainId
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

  return <TabContentBase allSlugsSorted={allSlugsSorted} manageActive={true} />;
};

interface TabContentBaseProps {
  manageActive: boolean;
  allSlugsSorted: string[];
  shouldShowHiddenTokensHint?: boolean;
}

const TabContentBase = memo<TabContentBaseProps>(
  ({ allSlugsSorted, manageActive, shouldShowHiddenTokensHint = false }) => {
    const { publicKeyHash, network, accountId } = useContext(TezosChainTokensTabContext);

    const promoRef = useRef<HTMLDivElement>(null);
    const firstListItemRef = useRef<TokenListItemElement>(null);
    const { displayedSlugs, isSyncing, loadNext, searchValue, isInSearchMode, setSearchValue } =
      useTezosChainAccountTokensListingLogic(allSlugsSorted, network.chainId);

    const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

    const { tokensView, getElementIndex } = useMemo(() => {
      const tokensJsx = displayedSlugs.map((assetSlug, i) => (
        <TezosTokenListItem
          key={assetSlug}
          network={network}
          index={i}
          publicKeyHash={publicKeyHash}
          assetSlug={assetSlug}
          scam={mainnetTokensScamSlugsRecord[assetSlug]}
          manageActive={manageActive}
          ref={i === 0 ? firstListItemRef : null}
        />
      ));

      if (manageActive)
        return {
          tokensView: tokensJsx,
          getElementIndex: makeGetTokenElementIndexFunction(promoRef, firstListItemRef, tokensJsx.length)
        };

      const promoJsx = (
        <PartnersPromotion
          id="promo-token-item"
          key="promo-token-item"
          variant={PartnersPromotionVariant.Text}
          pageName="Token page"
          ref={promoRef}
        />
      );

      return {
        tokensView: getTokensViewWithPromo(tokensJsx, promoJsx),
        getElementIndex: makeGetTokenElementIndexFunction(promoRef, firstListItemRef, tokensJsx.length)
      };
    }, [network, displayedSlugs, publicKeyHash, mainnetTokensScamSlugsRecord, manageActive]);

    const { onTokensTabClick, onCollectiblesTabClick } = useContext(TezosChainTokensTabContext);

    return (
      <TokensTabBase
        accountId={accountId}
        tokensCount={displayedSlugs.length}
        searchValue={searchValue}
        getElementIndex={getElementIndex}
        loadNextPage={loadNext}
        onSearchValueChange={setSearchValue}
        isSyncing={isSyncing}
        isInSearchMode={isInSearchMode}
        network={network}
        shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
        onTokensTabClick={onTokensTabClick}
        onCollectiblesTabClick={onCollectiblesTabClick}
      >
        {tokensView}
      </TokensTabBase>
    );
  }
);
