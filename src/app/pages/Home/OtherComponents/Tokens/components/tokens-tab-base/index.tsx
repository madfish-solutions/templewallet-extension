import React, { FC, memo, useMemo } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { SyncSpinner } from 'app/atoms';
import { AddCustomTokenButton } from 'app/atoms/AddCustomTokenButton';
import { AnimatedMenuChevron } from 'app/atoms/animated-menu-chevron';
import { PageLoader } from 'app/atoms/Loader';
import {
  VisibilityTrackingInfiniteScroll,
  VisibilityTrackingInfiniteScrollProps
} from 'app/atoms/visibility-tracking-infinite-scroll';
import { useManageState } from 'app/hooks/use-assets-view-state';
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
import { AccountCollectible } from 'lib/assets/hooks/collectibles';
import { toChainAssetSlug } from 'lib/assets/utils';
import { t, T } from 'lib/i18n';
import { useActivateAnimatedChevron } from 'lib/ui/hooks/use-activate-animated-chevron';
import { Link, navigate } from 'lib/woozie';
import { OneOfChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

export interface TokensTabBaseProps {
  tokensCount: number;
  getElementIndex: VisibilityTrackingInfiniteScrollProps['getElementsIndexes'];
  loadNextPage: EmptyFn;
  isSyncingTokens: boolean;
  accountId: string;
  isInSearchMode: boolean;
  network?: OneOfChains;
  shouldShowHiddenTokensHint?: boolean;
  collectibles: AccountCollectible[];
  collectiblesReady: boolean;
  collectiblesSortPredicate: (aChainAssetSlug: string, bChainAssetSlug: string) => number;
}

export const TokensTabBase: FC<PropsWithChildren<TokensTabBaseProps>> = props => {
  const { manageActive } = useManageState();

  return (
    <>
      <FadeTransition>
        <TokensTabBaseContent {...props} manageActive={manageActive} />
      </FadeTransition>

      <DAppConnection />
    </>
  );
};

interface TokensTabBaseContentProps extends TokensTabBaseProps {
  manageActive: boolean;
}

const goToNftsPage = () => navigate('/nfts');

const TokensTabBaseContent: FC<PropsWithChildren<TokensTabBaseContentProps>> = ({
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
  collectibles,
  collectiblesReady,
  collectiblesSortPredicate
}) => {
  const isTestnet = useTestnetModeEnabledSelector();
  const accountIsInitialized = useIsAccountInitializedSelector(accountId);
  const isSyncingInitializedState = useIsAccountInitializedLoadingSelector(accountId);
  const { animatedChevronRef, handleHover, handleUnhover } = useActivateAnimatedChevron();

  const collectiblesSlugsSorted = useMemo(
    () =>
      collectibles
        .filter(({ status }) => status === 'enabled')
        .map(({ slug, chainId }) =>
          toChainAssetSlug(typeof chainId === 'number' ? TempleChainKind.EVM : TempleChainKind.Tezos, chainId, slug)
        )
        .sort(collectiblesSortPredicate),
    [collectibles, collectiblesSortPredicate]
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
          stretch
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

          <Link
            to="/nfts"
            className="mt-6 bg-white rounded-8 border-0.5 border-lines p-1 pt-0 flex flex-col"
            onMouseEnter={handleHover}
            onMouseLeave={handleUnhover}
            testID={HomeSelectors.nftsSection}
          >
            <div className="flex justify-between items-center p-2 gap-1">
              <span className="text-font-description-bold">NFTs</span>
              <AnimatedMenuChevron ref={animatedChevronRef} />
            </div>
            {collectibles.length === 0 && collectiblesReady && (
              <div className="flex flex-col items-center px-2 py-3 gap-3 bg-background rounded-8">
                <p className="text-font-description-bold text-grey-1 text-center">Start your collection today!</p>

                <AddCustomTokenButton forCollectibles manageActive={false} network={network} />
              </div>
            )}
            {collectibles.length === 0 && !collectiblesReady && (
              <div className="flex justify-center items-center h-19">
                <SyncSpinner />
              </div>
            )}
            {collectibles.length > 0 && (
              <div className="flex p-2 bg-background rounded-8">
                <CollectiblesGroupGrid
                  isCollapsed
                  chainSlugs={collectiblesSlugsSorted}
                  colsCount={3}
                  isVisible
                  onShowMore={goToNftsPage}
                />
              </div>
            )}
          </Link>

          {isSyncing && <SyncSpinner className="mt-4" />}
        </>
      )}
    </TokensTabBaseContentWrapper>
  );
};

const UninitializedAccountContent = memo(() => (
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
));

const TokensTabBaseContentWrapper: FC<PropsWithChildren<{ padding?: boolean; className?: string }>> = ({
  padding,
  className,
  children
}) => (
  <ContentContainer withShadow={false} padding={padding} className={className}>
    {children}
  </ContentContainer>
);
