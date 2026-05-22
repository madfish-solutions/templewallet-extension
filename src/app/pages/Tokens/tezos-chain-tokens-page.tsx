import { Activity, createContext, FC, useContext, useMemo, useRef } from 'react';

import { constant, noop } from 'lodash';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import {
  useTezosChainAccountTokensForListing,
  useTezosChainAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-tezos-chain-account-tokens-listing-logic';
import { useTokensManageState } from 'app/hooks/use-assets-view-state';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { TezosTokenListItem } from 'app/templates/tokens/token-list-item';
import { TokenListItemFC, TokensViewWithPromo } from 'app/templates/tokens/tokens-views';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { getTokenElementIndex, makeFallbackChain, TokenListItemElement, useRenderPromo } from 'lib/ui/tokens-list';
import { TezosChain, useTezosChainByChainId } from 'temple/front';
import { TEZOS_DEFAULT_NETWORKS } from 'temple/networks';

import { TokensPageBase, TokensPageBaseProps } from './tokens-page-base';

interface Props {
  chainId: string;
  publicKeyHash: string;
  accountId: string;
}

const TezosChainTokensPageContext = createContext<
  Omit<Props, 'chainId'> & { network: TezosChain } & Pick<TokensPageBaseProps, 'toggleManageActive'>
>({
  network: makeFallbackChain(TEZOS_DEFAULT_NETWORKS[0]),
  publicKeyHash: '',
  accountId: '',
  toggleManageActive: noop
});

export const TezosChainTokensPage: FC<Props> = ({ chainId, accountId, publicKeyHash }) => {
  const network = useTezosChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const { manageActive, toggleManageActive } = useTokensManageState();
  const contextValue = useMemo(
    () => ({ accountId, network, publicKeyHash, toggleManageActive }),
    [accountId, network, publicKeyHash, toggleManageActive]
  );

  return (
    <TezosChainTokensPageContext value={contextValue}>
      <Activity mode={manageActive ? 'hidden' : 'visible'} name="tezos-chain-tokens-page-default">
        <PageContent />
      </Activity>

      <Activity mode={manageActive ? 'visible' : 'hidden'} name="tezos-chain-tokens-page-manage">
        <PageContentWithManageActive />
      </Activity>
    </TezosChainTokensPageContext>
  );
};

const PageContent: FC = () => {
  const { publicKeyHash, network } = useContext(TezosChainTokensPageContext);

  const { enabledTokenSlugsSorted, shouldShowHiddenTokensHint } = useTezosChainAccountTokensForListing(
    publicKeyHash,
    network.chainId
  );

  return (
    <PageContentBase
      manageActive={false}
      allSlugsSorted={enabledTokenSlugsSorted}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
    />
  );
};

const PageContentWithManageActive: FC = () => {
  const { publicKeyHash, network } = useContext(TezosChainTokensPageContext);

  const { enabledTokenSlugsSorted, tokens, tokensSortPredicate } = useTezosChainAccountTokensForListing(
    publicKeyHash,
    network.chainId
  );

  const allTokensSlugs = tokens.filter(({ status }) => status !== 'removed').map(({ slug }) => slug);

  const allTokensSlugsSorted = useMemoWithCompare(
    () => allTokensSlugs.sort(tokensSortPredicate),
    [allTokensSlugs, tokensSortPredicate]
  );

  const allSlugsSorted = usePreservedOrderSlugsToManage(enabledTokenSlugsSorted, allTokensSlugsSorted);

  return <PageContentBase allSlugsSorted={allSlugsSorted} manageActive={true} />;
};

interface PageContentBaseProps {
  manageActive: boolean;
  allSlugsSorted: string[];
  shouldShowHiddenTokensHint?: boolean;
}

const PageContentBase: FC<PageContentBaseProps> = ({
  allSlugsSorted,
  manageActive,
  shouldShowHiddenTokensHint = false
}) => {
  const { publicKeyHash, network, accountId, ...tokensPageBaseProps } = useContext(TezosChainTokensPageContext);

  const promoRef = useRef<HTMLDivElement>(null);
  const firstListItemRef = useRef<TokenListItemElement>(null);
  const { displayedSlugs, isSyncing, loadNext, isInSearchMode } = useTezosChainAccountTokensListingLogic(
    allSlugsSorted,
    network.chainId
  );

  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();
  const TokenListItem: TokenListItemFC = ({ slug, ref, index }) => (
    <TezosTokenListItem
      network={network}
      index={index}
      publicKeyHash={publicKeyHash}
      assetSlug={slug}
      scam={mainnetTokensScamSlugsRecord[slug]}
      manageActive={manageActive}
      ref={ref}
    />
  );

  const getElementIndex = (y: number) =>
    getTokenElementIndex(promoRef.current, firstListItemRef.current, displayedSlugs, constant(true), y);
  const Promo = useRenderPromo(manageActive, promoRef);

  const applicableNetworks = useMemo(() => [network], [network]);

  return (
    <TokensPageBase
      applicableNetworks={applicableNetworks}
      accountId={accountId}
      tokensCount={displayedSlugs.length}
      getElementIndex={getElementIndex}
      loadNextPage={loadNext}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      manageActive={manageActive}
      network={network}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      {...tokensPageBaseProps}
    >
      <TokensViewWithPromo
        displayedSlugs={displayedSlugs}
        Promo={Promo}
        firstListItemRef={firstListItemRef}
        TokenListItem={TokenListItem}
      />
    </TokensPageBase>
  );
};
