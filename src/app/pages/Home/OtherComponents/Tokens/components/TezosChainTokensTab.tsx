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
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { TezosTokenListItem } from 'app/templates/TokenListItem';
import { useAdsConstantsModule } from 'lib/ads-constants';
import { toTezEnabledCollectiblesChainSlugs, useTezosChainAccountCollectibles } from 'lib/assets/hooks/collectibles';
import { useTezosChainCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useTezosCollectiblesMetadataPresenceCheck } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TokenListItemElement } from 'lib/ui/tokens-list';
import { TezosChain, useTezosChainByChainId } from 'temple/front';
import { TEZOS_DEFAULT_NETWORKS } from 'temple/networks';

import { getTokensViewWithPromo, makeFallbackChain } from '../utils';

import { TokensTabBase, TokensTabBaseProps } from './tokens-tab-base';

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
  const PartnersPromotionModule = usePartnersPromotionModule();
  const AdsConstantsModule = useAdsConstantsModule();

  let tokensView: ReactChildren;
  let getElementIndex: SyncFn<number, number[]>;

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

  if (manageActive) {
    tokensView = tokensJsx;
    getElementIndex = () => range(0, tokensJsx.length);
  } else {
    const promoJsx =
      PartnersPromotionModule && AdsConstantsModule ? (
        <PartnersPromotionModule.PartnersPromotion
          id="promo-token-item"
          key="promo-token-item"
          variant={PartnersPromotionModule.PartnersPromotionVariant.Text}
          pageName={AdsConstantsModule.HOME_PAGE_NAME}
          ref={promoRef}
        />
      ) : null;

    tokensView = getTokensViewWithPromo(tokensJsx, promoJsx);
    getElementIndex = () => range(0, tokensJsx.length + 1);
  }

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
      {tokensView}
    </TokensTabBase>
  );
};
