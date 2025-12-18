import React, { createContext, FC, memo, useContext, useMemo, useRef } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import {
  useTezosChainAccountTokensForListing,
  useTezosChainAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-tezos-chain-account-tokens-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
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
}

const TezosChainTokensTabContext = createContext<Omit<Props, 'chainId'> & { network: TezosChain }>({
  network: makeFallbackChain(TEZOS_DEFAULT_NETWORKS[0]),
  publicKeyHash: '',
  accountId: ''
});

export const TezosChainTokensTab = memo<Props>(({ chainId, accountId, publicKeyHash }) => {
  const network = useTezosChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const { manageActive } = useAssetsViewState();
  const contextValue = useMemo(() => ({ accountId, network, publicKeyHash }), [accountId, network, publicKeyHash]);

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
    const { displayedSlugs, isSyncing, loadNext, isInSearchMode } = useTezosChainAccountTokensListingLogic(
      allSlugsSorted,
      network.chainId
    );

    const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();
    const PartnersPromotionModule = usePartnersPromotionModule();

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

      const promoJsx = PartnersPromotionModule ? (
        <PartnersPromotionModule.PartnersPromotion
          id="promo-token-item"
          key="promo-token-item"
          variant={PartnersPromotionModule.PartnersPromotionVariant.Text}
          pageName="Token page"
          ref={promoRef}
        />
      ) : null;

      return {
        tokensView: getTokensViewWithPromo(tokensJsx, promoJsx),
        getElementIndex: makeGetTokenElementIndexFunction(promoRef, firstListItemRef, tokensJsx.length)
      };
    }, [network, displayedSlugs, publicKeyHash, mainnetTokensScamSlugsRecord, manageActive, PartnersPromotionModule]);

    return (
      <TokensTabBase
        accountId={accountId}
        tokensCount={displayedSlugs.length}
        getElementIndex={getElementIndex}
        loadNextPage={loadNext}
        isSyncing={isSyncing}
        isInSearchMode={isInSearchMode}
        network={network}
        shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      >
        {tokensView}
      </TokensTabBase>
    );
  }
);
