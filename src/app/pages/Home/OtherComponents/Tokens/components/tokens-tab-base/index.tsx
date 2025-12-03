import React, { FC, memo } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { SyncSpinner } from 'app/atoms';
import { AddCustomTokenButton } from 'app/atoms/AddCustomTokenButton';
import { AssetsSegmentControl } from 'app/atoms/AssetsSegmentControl';
import { PageLoader } from 'app/atoms/Loader';
import {
  VisibilityTrackingInfiniteScroll,
  VisibilityTrackingInfiniteScrollProps
} from 'app/atoms/visibility-tracking-infinite-scroll';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { ContentContainer } from 'app/layouts/containers';
import BuyWithFiatImageSrc from 'app/misc/deposit/buy-with-fiat.png';
import CrossChainSwapImageSrc from 'app/misc/deposit/cross-chain-swap.png';
import { HomeSelectors } from 'app/pages/Home/selectors';
import {
  useIsAccountInitializedLoadingSelector,
  useIsAccountInitializedSelector
} from 'app/store/accounts-initialization/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { DAppConnection } from 'app/templates/DAppConnection';
import { DepositOption } from 'app/templates/deposit-option';
import { t, T } from 'lib/i18n';
import { OneOfChains } from 'temple/front';

import { EmptySection } from '../EmptySection';
import { UpdateAppBanner } from '../UpdateAppBanner';

export interface TokensTabBaseProps {
  searchValue: string;
  onSearchValueChange: SyncFn<string>;
  tokensCount: number;
  getElementIndex: VisibilityTrackingInfiniteScrollProps['getElementsIndexes'];
  loadNextPage: EmptyFn;
  isSyncing: boolean;
  accountId: string;
  isInSearchMode: boolean;
  network?: OneOfChains;
  shouldShowHiddenTokensHint?: boolean;
}

export const TokensTabBase: FC<PropsWithChildren<TokensTabBaseProps>> = ({
  searchValue,
  onSearchValueChange,
  ...restProps
}) => {
  const { manageActive, filtersOpened } = useAssetsViewState();

  return (
    <>
      <AssetsSegmentControl searchValue={searchValue} onSearchValueChange={onSearchValueChange} />

      {filtersOpened ? (
        <AssetsFilterOptions />
      ) : (
        <FadeTransition>
          <TokensTabBaseContent {...restProps} manageActive={manageActive} />
        </FadeTransition>
      )}

      <DAppConnection />
    </>
  );
};

interface TokensTabBaseContentProps extends Omit<TokensTabBaseProps, 'searchValue' | 'onSearchValueChange'> {
  manageActive: boolean;
}

const TokensTabBaseContent: FC<PropsWithChildren<TokensTabBaseContentProps>> = ({
  tokensCount,
  getElementIndex,
  loadNextPage,
  isSyncing,
  accountId,
  isInSearchMode,
  network,
  manageActive,
  shouldShowHiddenTokensHint,
  children
}) => {
  const isTestnet = useTestnetModeEnabledSelector();
  const accountIsInitialized = useIsAccountInitializedSelector(accountId);
  const isSyncingInitializedState = useIsAccountInitializedLoadingSelector(accountId);

  if (accountIsInitialized === false && !isSyncingInitializedState && !isTestnet && !manageActive) {
    return (
      <TokensTabBaseContentWrapper>
        <UninitializedAccountContent />
      </TokensTabBaseContentWrapper>
    );
  }

  if (
    (accountIsInitialized !== true && isSyncingInitializedState && !isTestnet) ||
    (tokensCount === 0 && isSyncing && !isInSearchMode)
  ) {
    return (
      <TokensTabBaseContentWrapper manageActive={manageActive} padding={false}>
        <PageLoader stretch />
      </TokensTabBaseContentWrapper>
    );
  }

  return (
    <TokensTabBaseContentWrapper manageActive={manageActive} padding={tokensCount > 0}>
      {tokensCount === 0 ? (
        <EmptySection
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
          <VisibilityTrackingInfiniteScroll getElementsIndexes={getElementIndex} loadNext={loadNextPage}>
            {children}
          </VisibilityTrackingInfiniteScroll>
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

const TokensTabBaseContentWrapper: FC<PropsWithChildren<{ manageActive?: boolean; padding?: boolean }>> = ({
  manageActive,
  padding,
  children
}) => (
  <ContentContainer withShadow={false} padding={padding}>
    {manageActive ? null : <UpdateAppBanner />}

    {children}
  </ContentContainer>
);
