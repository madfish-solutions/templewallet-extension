import React, { createContext, FC, memo, useContext, useMemo, useRef } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import {
  useEvmChainAccountTokensForListing,
  useEvmChainAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-evm-chain-account-tokens-listing-logic';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { EvmTokenListItem } from 'app/templates/TokenListItem';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { makeGetTokenElementIndexFunction, TokenListItemElement } from 'lib/ui/tokens-list';
import { EvmChain, useEvmChainByChainId } from 'temple/front/chains';
import { EVM_DEFAULT_NETWORKS } from 'temple/networks';

import { getTokensViewWithPromo, makeFallbackChain } from '../utils';

import { TokensTabBase } from './tokens-tab-base';

interface Props {
  chainId: number;
  publicKeyHash: HexString;
  accountId: string;
}

const TezosChainTokensTabContext = createContext<Omit<Props, 'chainId'> & { network: EvmChain }>({
  network: makeFallbackChain(EVM_DEFAULT_NETWORKS[0]),
  publicKeyHash: '0x',
  accountId: ''
});

export const EvmChainTokensTab = memo<Props>(({ chainId, publicKeyHash, accountId }) => {
  const network = useEvmChainByChainId(chainId);

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
  const { hideSmallBalance } = useTokensListOptionsSelector();

  const { enabledSlugsSorted, shouldShowHiddenTokensHint } = useEvmChainAccountTokensForListing(
    publicKeyHash,
    network.chainId,
    hideSmallBalance
  );

  return (
    <TabContentBase
      manageActive={false}
      allSlugsSorted={enabledSlugsSorted}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
    />
  );
};

const TabContentWithManageActive: FC = () => {
  const { publicKeyHash, network } = useContext(TezosChainTokensTabContext);
  const { hideSmallBalance } = useTokensListOptionsSelector();

  const { enabledSlugsSorted, tokens, tokensSortPredicate } = useEvmChainAccountTokensForListing(
    publicKeyHash,
    network.chainId,
    hideSmallBalance
  );

  const storedSlugs = useMemo(
    () => tokens.filter(({ status }) => status !== 'removed').map(({ slug }) => slug),
    [tokens]
  );

  const allStoredSlugsSorted = useMemoWithCompare(
    () => storedSlugs.sort(tokensSortPredicate),
    [storedSlugs, tokensSortPredicate]
  );

  const allSlugsSorted = usePreservedOrderSlugsToManage(enabledSlugsSorted, allStoredSlugsSorted);

  return <TabContentBase allSlugsSorted={allSlugsSorted} manageActive={true} />;
};

interface TabContentBaseProps {
  manageActive: boolean;
  allSlugsSorted: string[];
  shouldShowHiddenTokensHint?: boolean;
}

const TabContentBase = memo<TabContentBaseProps>(({ allSlugsSorted, manageActive, shouldShowHiddenTokensHint }) => {
  const { publicKeyHash, network, accountId } = useContext(TezosChainTokensTabContext);
  const { displayedSlugs, isSyncing, loadNext, searchValue, isInSearchMode, setSearchValue } =
    useEvmChainAccountTokensListingLogic(allSlugsSorted, network.chainId);
  const promoRef = useRef<HTMLDivElement>(null);
  const firstListItemRef = useRef<TokenListItemElement>(null);

  const { tokensView, getElementIndex } = useMemo(() => {
    const tokensJsx = displayedSlugs.map((slug, i) => (
      <EvmTokenListItem
        showTags
        key={slug}
        assetSlug={slug}
        publicKeyHash={publicKeyHash}
        network={network}
        index={i}
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
  }, [displayedSlugs, manageActive, network, publicKeyHash]);

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
    >
      {tokensView}
    </TokensTabBase>
  );
});
