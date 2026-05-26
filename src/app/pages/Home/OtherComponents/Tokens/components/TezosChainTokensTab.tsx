import { Activity, createContext, FC, useContext, useMemo, useRef } from 'react';

import { range } from 'lodash';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import {
  useTezosChainAccountTokensForListing,
  useTezosChainAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-tezos-chain-account-tokens-listing-logic';
import { useTokensManageState } from 'app/hooks/use-assets-view-state';
import { useAreAssetsLoading, useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { TezosTokenListItem } from 'app/templates/TokenListItem';
import { toTezEnabledCollectiblesChainSlugs, useTezosChainAccountCollectibles } from 'lib/assets/hooks/collectibles';
import { useTezosChainCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useTezosCollectiblesMetadataPresenceCheck } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TokenListItemElement } from 'lib/ui/tokens-list';
import { TezosChain, useTezosChainByChainId } from 'temple/front';
import { TEZOS_DEFAULT_NETWORKS } from 'temple/networks';

import { makeFallbackChain, useRenderPromo } from '../utils';

import { TokensTabBase, TokensTabBaseProps } from './tokens-tab-base';
import { TokenListItemFC, TokensViewWithPromo } from './tokens-views';

interface Props {
  chainId: string;
  publicKeyHash: string;
  accountId: string;
}

const TezosChainTokensTabContext = createContext<
  Omit<Props, 'chainId'> & { network: TezosChain } & Pick<
      TokensTabBaseProps,
      'tezosCollectibles' | 'collectiblesReady' | 'collectiblesSortPredicate'
    >
>({
  network: makeFallbackChain(TEZOS_DEFAULT_NETWORKS[0]),
  publicKeyHash: '',
  accountId: '',
  tezosCollectibles: [],
  collectiblesReady: false,
  collectiblesSortPredicate: () => 0
});

export const TezosChainTokensTab: FC<Props> = ({ chainId, accountId, publicKeyHash }) => {
  const network = useTezosChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const tezosCollectibles = useTezosChainAccountCollectibles(publicKeyHash, chainId);
  const collectiblesLoading = useAreAssetsLoading('collectibles');
  const collectiblesReady = tezosCollectibles.length > 0 || !collectiblesLoading;
  const collectiblesSortPredicate = useTezosChainCollectiblesSortPredicate(publicKeyHash, chainId);
  const { manageActive } = useTokensManageState();
  const contextValue = {
    accountId,
    network,
    publicKeyHash,
    tezosCollectibles,
    collectiblesReady,
    collectiblesSortPredicate
  };

  const tezEnabledCollectiblesChainsSlugs = useMemo(
    () => toTezEnabledCollectiblesChainSlugs(tezosCollectibles),
    [tezosCollectibles]
  );
  useTezosCollectiblesMetadataPresenceCheck(tezEnabledCollectiblesChainsSlugs);

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

  const allTokensSlugs = tokens.filter(({ status }) => status !== 'removed').map(({ slug }) => slug);

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
  const { publicKeyHash, network, accountId, ...tokensTabBaseProps } = useContext(TezosChainTokensTabContext);

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

  const getElementIndex = () => range(0, displayedSlugs.length + 1);

  const Promo = useRenderPromo(manageActive, promoRef);

  return (
    <TokensTabBase
      accountId={accountId}
      tokensCount={displayedSlugs.length}
      getElementIndex={getElementIndex}
      loadNextPage={loadNext}
      isSyncingTokens={isSyncing}
      isInSearchMode={isInSearchMode}
      manageActive={manageActive}
      network={network}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      {...tokensTabBaseProps}
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
