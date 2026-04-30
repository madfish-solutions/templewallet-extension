import React, { createContext, FC, memo, useContext, useMemo, useRef } from 'react';

import { range } from 'lodash';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useEvmBalancesAreLoading } from 'app/hooks/listing-logic/use-evm-balances-loading-state';
import {
  useEvmChainAccountTokensForListing,
  useEvmChainAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-evm-chain-account-tokens-listing-logic';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import { useManageState } from 'app/hooks/use-assets-view-state';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { EvmTokenListItem } from 'app/templates/TokenListItem';
import { useAdsConstantsModule } from 'lib/ads-constants';
import { useEvmChainAccountCollectibles } from 'lib/assets/hooks/collectibles';
import { useEvmChainCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TokenListItemElement } from 'lib/ui/tokens-list';
import { EvmChain, useEvmChainByChainId } from 'temple/front/chains';
import { EVM_DEFAULT_NETWORKS } from 'temple/networks';

import { getTokensViewWithPromo, makeFallbackChain } from '../utils';

import { TokensTabBase, TokensTabBaseProps } from './tokens-tab-base';

interface Props {
  chainId: number;
  publicKeyHash: HexString;
  accountId: string;
}

const EvmChainTokensTabContext = createContext<
  Omit<Props, 'chainId'> & { network: EvmChain } & Pick<
      TokensTabBaseProps,
      'collectibles' | 'collectiblesReady' | 'collectiblesSortPredicate'
    >
>({
  network: makeFallbackChain(EVM_DEFAULT_NETWORKS[0]),
  publicKeyHash: '0x',
  accountId: '',
  collectibles: [],
  collectiblesReady: false,
  collectiblesSortPredicate: () => 0
});

export const EvmChainTokensTab = memo<Props>(({ chainId, publicKeyHash, accountId }) => {
  const network = useEvmChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const collectibles = useEvmChainAccountCollectibles(publicKeyHash, chainId);
  const collectiblesLoading = useEvmBalancesAreLoading();
  const collectiblesMetadataLoading = useEvmCollectiblesMetadataLoadingSelector();
  const collectiblesReady = collectibles.length > 0 || (!collectiblesLoading && !collectiblesMetadataLoading);
  const collectiblesSortPredicate = useEvmChainCollectiblesSortPredicate(publicKeyHash, chainId);

  const { manageActive } = useManageState();
  const contextValue = useMemo(
    () => ({ accountId, network, publicKeyHash, collectibles, collectiblesReady, collectiblesSortPredicate }),
    [accountId, network, publicKeyHash, collectibles, collectiblesReady, collectiblesSortPredicate]
  );

  return (
    <EvmChainTokensTabContext value={contextValue}>
      {manageActive ? <TabContentWithManageActive /> : <TabContent />}
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
  const { publicKeyHash, network, accountId, ...tokensTabBaseProps } = useContext(EvmChainTokensTabContext);
  const { displayedSlugs, isSyncing, loadNext, isInSearchMode } = useEvmChainAccountTokensListingLogic(
    allSlugsSorted,
    network.chainId
  );
  const promoRef = useRef<HTMLDivElement>(null);
  const firstListItemRef = useRef<TokenListItemElement>(null);
  const PartnersPromotionModule = usePartnersPromotionModule();
  const AdsConstantsModule = useAdsConstantsModule();

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
        getElementIndex: () => range(0, tokensJsx.length)
      };

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

    return {
      tokensView: getTokensViewWithPromo(tokensJsx, promoJsx),
      getElementIndex: () => range(0, tokensJsx.length + 1)
    };
  }, [displayedSlugs, manageActive, network, publicKeyHash, PartnersPromotionModule, AdsConstantsModule]);

  return (
    <TokensTabBase
      accountId={accountId}
      tokensCount={displayedSlugs.length}
      getElementIndex={getElementIndex}
      loadNextPage={loadNext}
      isSyncingTokens={isSyncing}
      isInSearchMode={isInSearchMode}
      network={network}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      {...tokensTabBaseProps}
    >
      {tokensView}
    </TokensTabBase>
  );
});
