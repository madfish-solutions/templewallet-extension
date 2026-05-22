import React, { Activity, createContext, FC, memo, useContext, useMemo, useRef } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import {
  useEvmChainAccountTokensForListing,
  useEvmChainAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-evm-chain-account-tokens-listing-logic';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import { useTokensManageState } from 'app/hooks/use-assets-view-state';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { EvmTokenListItem } from 'app/templates/TokenListItem';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { getTokenElementIndex, TokenListItemElement, useEvmChainTokenWillBeRendered } from 'lib/ui/tokens-list';
import { EvmChain, useEvmChainByChainId } from 'temple/front/chains';
import { EVM_DEFAULT_NETWORKS } from 'temple/networks';

import { makeFallbackChain, useRenderPromo } from '../utils';

import { TokensTabBase } from './tokens-tab-base';
import { TokenListItemFC, TokensViewWithPromo } from './tokens-views';

interface Props {
  chainId: number;
  publicKeyHash: HexString;
  accountId: string;
}

const EvmChainTokensTabContext = createContext<Omit<Props, 'chainId'> & { network: EvmChain }>({
  network: makeFallbackChain(EVM_DEFAULT_NETWORKS[0]),
  publicKeyHash: '0x',
  accountId: ''
});

export const EvmChainTokensTab = memo<Props>(({ chainId, publicKeyHash, accountId }) => {
  const network = useEvmChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const { manageActive } = useTokensManageState();
  const contextValue = useMemo(() => ({ accountId, network, publicKeyHash }), [accountId, network, publicKeyHash]);

  return (
    <EvmChainTokensTabContext value={contextValue}>
      <Activity mode={manageActive ? 'hidden' : 'visible'} name="evm-chain-tokens-tab-default">
        <TabContent />
      </Activity>

      <Activity mode={manageActive ? 'visible' : 'hidden'} name="evm-chain-tokens-tab-manage">
        <TabContentWithManageActive />
      </Activity>
    </EvmChainTokensTabContext>
  );
});

const TabContent: FC = () => {
  const { publicKeyHash, network } = useContext(EvmChainTokensTabContext);
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
  const { publicKeyHash, network } = useContext(EvmChainTokensTabContext);
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
  const { publicKeyHash, network, accountId } = useContext(EvmChainTokensTabContext);
  const { displayedSlugs, isSyncing, loadNext, isInSearchMode } = useEvmChainAccountTokensListingLogic(
    allSlugsSorted,
    network.chainId
  );
  const promoRef = useRef<HTMLDivElement>(null);
  const firstListItemRef = useRef<TokenListItemElement>(null);

  const tokenWillBeRendered = useEvmChainTokenWillBeRendered(network);

  const TokenListItem: TokenListItemFC = ({ slug, ref, index }) => {
    return (
      <EvmTokenListItem
        showTags
        network={network}
        index={index}
        assetSlug={slug}
        publicKeyHash={publicKeyHash}
        manageActive={manageActive}
        ref={ref}
      />
    );
  };

  const getElementIndex = (y: number) =>
    getTokenElementIndex(promoRef.current, firstListItemRef.current, displayedSlugs, tokenWillBeRendered, y);

  const Promo = useRenderPromo(manageActive, promoRef);

  return (
    <TokensTabBase
      accountId={accountId}
      tokensCount={displayedSlugs.length}
      getElementIndex={getElementIndex}
      loadNextPage={loadNext}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      manageActive={manageActive}
      network={network}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
    >
      <TokensViewWithPromo
        displayedSlugs={displayedSlugs}
        Promo={Promo}
        firstListItemRef={firstListItemRef}
        TokenListItem={TokenListItem}
      />
    </TokensTabBase>
  );
});
