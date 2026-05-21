import { Activity, createContext, FC, useContext, useMemo, useRef } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import {
  useTezosChainAccountTokensForListing,
  useTezosChainAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-tezos-chain-account-tokens-listing-logic';
import { useTokensManageState } from 'app/hooks/use-assets-view-state';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { TezosTokenListItem } from 'app/templates/TokenListItem';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { getTokenElementIndex, TokenListItemElement, useTokenWillBeRendered } from 'lib/ui/tokens-list';
import { TezosChain, useTezosChainByChainId } from 'temple/front';
import { TEZOS_DEFAULT_NETWORKS } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { makeFallbackChain, useRenderPromo } from '../utils';

import { TokensTabBase } from './tokens-tab-base';
import { TokenListItemFC, TokensViewWithPromo } from './tokens-views';

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

export const TezosChainTokensTab: FC<Props> = ({ chainId, accountId, publicKeyHash }) => {
  const network = useTezosChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const { manageActive } = useTokensManageState();
  const contextValue = useMemo(() => ({ accountId, network, publicKeyHash }), [accountId, network, publicKeyHash]);

  return (
    <TezosChainTokensTabContext value={contextValue}>
      <Activity mode={manageActive ? 'hidden' : 'visible'} name="tezos-chain-tokens-tab-default">
        <TabContent />
      </Activity>

      <Activity mode={manageActive ? 'visible' : 'hidden'} name="tezos-chain-tokens-tab-manage">
        <TabContentWithManageActive />
      </Activity>
    </TezosChainTokensTabContext>
  );
};

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

const TabContentBase: FC<TabContentBaseProps> = ({
  allSlugsSorted,
  manageActive,
  shouldShowHiddenTokensHint = false
}) => {
  const { publicKeyHash, network, accountId } = useContext(TezosChainTokensTabContext);

  const promoRef = useRef<HTMLDivElement>(null);
  const firstListItemRef = useRef<TokenListItemElement>(null);
  const { displayedSlugs, isSyncing, loadNext, isInSearchMode } = useTezosChainAccountTokensListingLogic(
    allSlugsSorted,
    network.chainId
  );

  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

  const tokenWillBeRendered = useTokenWillBeRendered();

  const TokenListItem: TokenListItemFC = ({ chainSlug, ref, index }) => {
    const [, , assetSlug] = parseChainAssetSlug(chainSlug, TempleChainKind.Tezos);

    return (
      <TezosTokenListItem
        network={network}
        index={index}
        publicKeyHash={publicKeyHash}
        assetSlug={assetSlug}
        scam={mainnetTokensScamSlugsRecord[assetSlug]}
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
};
