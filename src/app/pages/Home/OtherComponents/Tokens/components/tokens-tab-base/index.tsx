import React, { FC, useMemo } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { SyncSpinner } from 'app/atoms';
import { AddCustomTokenButton } from 'app/atoms/AddCustomTokenButton';
import { AnimatedMenuChevron } from 'app/atoms/animated-menu-chevron';
import { PageLoader } from 'app/atoms/Loader';
import {
  VisibilityTrackingInfiniteScroll,
  VisibilityTrackingInfiniteScrollProps
} from 'app/atoms/visibility-tracking-infinite-scroll';
import { ContentContainer } from 'app/layouts/containers';
import BuyWithFiatImageSrc from 'app/misc/deposit/buy-with-fiat.png';
import CrossChainSwapImageSrc from 'app/misc/deposit/cross-chain-swap.png';
import { HomeSelectors } from 'app/pages/Home/selectors';
import {
  useIsAccountInitializedLoadingSelector,
  useIsAccountInitializedSelector
} from 'app/store/accounts-initialization/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { AssetsEmptySection } from 'app/templates/assets-empty-section';
import { CollectiblesGroupGrid } from 'app/templates/collectibles/collectibles-group-grid';
import { DAppConnection } from 'app/templates/DAppConnection';
import { DepositOption } from 'app/templates/deposit-option';
import {
  AccountCollectible,
  toEvmEnabledCollectiblesChainSlugs,
  toTezEnabledCollectiblesChainSlugs
} from 'lib/assets/hooks/collectibles';
import { t, T } from 'lib/i18n';
import { useActivateAnimatedChevron } from 'lib/ui/hooks/use-activate-animated-chevron';
import { Link, navigate } from 'lib/woozie';
import { OneOfChains } from 'temple/front';

export interface TokensTabBaseProps {
  tokensCount: number;
  getElementIndex: VisibilityTrackingInfiniteScrollProps['getElementsIndexes'];
  loadNextPage: EmptyFn;
  isSyncingTokens: boolean;
  accountId: string;
  isInSearchMode: boolean;
  manageActive: boolean;
  network?: OneOfChains;
  shouldShowHiddenTokensHint?: boolean;
  tezosCollectibles?: AccountCollectible[];
  evmCollectibles?: AccountCollectible[];
  collectiblesReady: boolean;
  collectiblesSortPredicate: (aChainAssetSlug: string, bChainAssetSlug: string) => number;
}

const goToNftsPage = () => navigate('/nfts');

export const TokensTabBase: FC<PropsWithChildren<TokensTabBaseProps>> = ({ ...restProps }) => (
  <>
    <FadeTransition>
      <TokensTabBaseContent {...restProps} />
    </FadeTransition>

    <DAppConnection />
  </>
);

const TokensTabBaseContent: FC<PropsWithChildren<TokensTabBaseProps>> = ({
  tokensCount,
  getElementIndex,
  loadNextPage,
  isSyncingTokens: isSyncing,
  accountId,
  isInSearchMode,
  network,
  manageActive,
  shouldShowHiddenTokensHint,
  children,
  tezosCollectibles,
  evmCollectibles,
  collectiblesReady,
  collectiblesSortPredicate
}) => {
  const isTestnet = useTestnetModeEnabledSelector();
  const accountIsInitialized = useIsAccountInitializedSelector(accountId);
  const isSyncingInitializedState = useIsAccountInitializedLoadingSelector(accountId);
  const { animatedChevronRef, handleHover, handleUnhover } = useActivateAnimatedChevron();

  const tezosCollectiblesSlugs = toTezEnabledCollectiblesChainSlugs(tezosCollectibles ?? []);
  const evmCollectiblesSlugs = toEvmEnabledCollectiblesChainSlugs(evmCollectibles ?? []);
  const collectiblesSlugsSorted = tezosCollectiblesSlugs.concat(evmCollectiblesSlugs).sort(collectiblesSortPredicate);
  const collectibles = useMemo(
    () => (tezosCollectibles ?? []).concat(evmCollectibles ?? []),
    [tezosCollectibles, evmCollectibles]
  );

  if (accountIsInitialized === false && !isSyncingInitializedState && !isTestnet && !manageActive) {
    return (
      <TokensTabBaseContentWrapper className="pt-0!">
        <UninitializedAccountContent />
      </TokensTabBaseContentWrapper>
    );
  }

  if (
    (accountIsInitialized !== true && isSyncingInitializedState && !isTestnet) ||
    (tokensCount === 0 && isSyncing && !isInSearchMode)
  ) {
    return (
      <TokensTabBaseContentWrapper padding={false}>
        <PageLoader stretch />
      </TokensTabBaseContentWrapper>
    );
  }

  return (
    <TokensTabBaseContentWrapper padding={tokensCount > 0}>
      {tokensCount === 0 ? (
        <AssetsEmptySection
          network={network}
          forCollectibles={false}
          forSearch={isInSearchMode}
          manageActive={manageActive}
          shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
        />
      ) : (
        <>
          {manageActive && (
            <AddCustomTokenButton
              forCollectibles={false}
              manageActive={manageActive}
              network={network}
              className="mb-4"
            />
          )}
          <div className="w-full max-h-96 flex flex-col overflow-auto">
            <VisibilityTrackingInfiniteScroll getElementsIndexes={getElementIndex} loadNext={loadNextPage}>
              {children}
            </VisibilityTrackingInfiniteScroll>
          </div>

          <div
            className="mt-6 bg-white rounded-8 border-0.5 border-lines p-1 pt-0 flex flex-col"
            onMouseEnter={handleHover}
            onMouseLeave={handleUnhover}
          >
            <Link to="/nfts" className="flex justify-between items-center p-2 gap-1" testID={HomeSelectors.nftsSection}>
              <span className="text-font-description-bold">{t('nfts')}</span>
              <AnimatedMenuChevron ref={animatedChevronRef} />
            </Link>
            {collectibles.length === 0 && collectiblesReady && (
              <div className="flex flex-col items-center px-2 py-3 gap-3 bg-background rounded-8">
                <p className="text-font-description-bold text-grey-1 text-center">{t('startYourCollectionToday')}</p>

                <AddCustomTokenButton forCollectibles manageActive={false} network={network} />
              </div>
            )}
            {collectibles.length === 0 && !collectiblesReady && (
              <div className="flex justify-center items-center h-19">
                <SyncSpinner />
              </div>
            )}
            {collectibles.length > 0 && (
              <div className="flex flex-col p-2 bg-background rounded-8">
                <CollectiblesGroupGrid
                  isCollapsed
                  chainSlugs={collectiblesSlugsSorted}
                  colsCount={3}
                  isVisible
                  onShowMore={goToNftsPage}
                />
              </div>
            )}
          </div>

          {isSyncing && <SyncSpinner className="mt-4" />}
        </>
      )}
    </TokensTabBaseContentWrapper>
  );
};

const UninitializedAccountContent = () => (
  <>
    <p className="p-1 mb-1 text-font-description-bold text-grey-1">
      <T id="depositTokensToGetStarted" />
    </p>

    <DepositOption
      paymentIcons
      to="/buy/card"
      title={t('buyWithFiat')}
      description={t('buyWithFiatDescription')}
      testID={HomeSelectors.buyWithFiatButton}
      imageSrc={BuyWithFiatImageSrc}
      className="mb-2"
    />

    <DepositOption
      to="/buy/crypto"
      title={t('crossChainSwap')}
      description={t('crossChainSwapDescription')}
      testID={HomeSelectors.crossChainSwapButton}
      imageSrc={CrossChainSwapImageSrc}
    />
  </>
);

const TokensTabBaseContentWrapper: FC<PropsWithChildren<{ padding?: boolean; className?: string }>> = ({
  padding,
  className,
  children
}) => (
  <ContentContainer withShadow={false} padding={padding} className={className}>
    {children}
  </ContentContainer>
);
