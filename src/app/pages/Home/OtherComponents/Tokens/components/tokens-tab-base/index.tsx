import React, { FC, memo } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { SyncSpinner } from 'app/atoms';
import { AddCustomTokenButton } from 'app/atoms/AddCustomTokenButton';
import { PageLoader } from 'app/atoms/Loader';
import { ManageAssetsViewStateButtons } from 'app/atoms/ManageAssetsViewStateButtons';
import {
  VisibilityTrackingInfiniteScroll,
  VisibilityTrackingInfiniteScrollProps
} from 'app/atoms/visibility-tracking-infinite-scroll';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { ReactComponent as ApplePayIcon } from 'app/icons/payment-options/apple-pay-no-frame.svg';
import { ReactComponent as MastercardIcon } from 'app/icons/payment-options/mastercard.svg';
import { ReactComponent as VisaIcon } from 'app/icons/payment-options/visa.svg';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { HomeSelectors } from 'app/pages/Home/selectors';
import {
  useIsAccountInitializedLoadingSelector,
  useIsAccountInitializedSelector
} from 'app/store/accounts-initialization/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { BuyModals, useBuyModalsState } from 'app/templates/buy-modals';
import { DAppConnection } from 'app/templates/DAppConnection';
import { IllustratedOption } from 'app/templates/illustrated-option';
import { SearchBarField } from 'app/templates/SearchField';
import { T } from 'lib/i18n';
import { OneOfChains } from 'temple/front';

import { EmptySection } from '../EmptySection';
import { UpdateAppBanner } from '../UpdateAppBanner';

import BuyWithFiatIllustrationSrc from './buy-with-fiat.png';
import CrossChainSwapIllustrationSrc from './cross-chain-swap.png';

export interface TokensTabBaseProps {
  tokensCount: number;
  searchValue: string;
  getElementIndex: VisibilityTrackingInfiniteScrollProps['getElementsIndexes'];
  loadNextPage: EmptyFn;
  onSearchValueChange: (value: string) => void;
  isSyncing: boolean;
  accountId: string;
  isInSearchMode: boolean;
  network?: OneOfChains;
}

export const TokensTabBase: FC<PropsWithChildren<TokensTabBaseProps>> = ({
  tokensCount,
  searchValue,
  onSearchValueChange,
  ...restProps
}) => {
  const { manageActive, filtersOpened } = useAssetsViewState();

  return (
    <>
      <StickyBar>
        <SearchBarField
          value={searchValue}
          disabled={filtersOpened}
          onValueChange={onSearchValueChange}
          testID={AssetsSelectors.searchAssetsInputTokens}
        />

        <ManageAssetsViewStateButtons />
      </StickyBar>

      {filtersOpened ? (
        <AssetsFilterOptions />
      ) : (
        <FadeTransition>
          <TokensTabBaseContent {...restProps} tokensCount={tokensCount} manageActive={manageActive} />
        </FadeTransition>
      )}

      <DAppConnection />
    </>
  );
};

interface TokensTabBaseContentProps {
  tokensCount: number;
  getElementIndex: VisibilityTrackingInfiniteScrollProps['getElementsIndexes'];
  loadNextPage: EmptyFn;
  isSyncing: boolean;
  accountId: string;
  isInSearchMode: boolean;
  network?: OneOfChains;
  manageActive: boolean;
}

const fiatOptionsIcons = [MastercardIcon, VisaIcon, ApplePayIcon];

const TokensTabBaseContent: FC<PropsWithChildren<TokensTabBaseContentProps>> = ({
  tokensCount,
  getElementIndex,
  loadNextPage,
  isSyncing,
  accountId,
  isInSearchMode,
  network,
  manageActive,
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
          forCollectibles={false}
          manageActive={manageActive}
          forSearch={isInSearchMode}
          network={network}
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

const UninitializedAccountContent = memo(() => {
  const {
    cryptoExchangeModalOpened,
    debitCreditCardModalOpened,
    closeCryptoExchangeModal,
    closeDebitCreditCardModal,
    openCryptoExchangeModal,
    openDebitCreditCardModal
  } = useBuyModalsState();

  return (
    <>
      <p className="p-1 mb-1 text-font-description-bold text-grey-1">
        <T id="depositTokensToGetStarted" />
      </p>

      <IllustratedOption
        title={
          <div className="flex gap-2 flex-wrap items-center">
            <span>
              <T id="buyWithFiat" />
            </span>

            <div className="flex gap-1 items-center">
              {fiatOptionsIcons.map((Icon, index) => (
                <div
                  className="w-[29px] h-5 px-1 flex items-center justify-center border-0.5 border-lines rounded"
                  key={index}
                >
                  <Icon />
                </div>
              ))}
            </div>
          </div>
        }
        className="mb-2"
        descriptionI18nKey="buyWithFiatDescription"
        testID={HomeSelectors.buyWithFiatButton}
        IllustrationAsset={BuyWithFiatIllustrationSrc}
        onClick={openDebitCreditCardModal}
      />

      <IllustratedOption
        title={<T id="crossChainSwap" />}
        descriptionI18nKey="crossChainSwapDescription"
        testID={HomeSelectors.crossChainSwapButton}
        IllustrationAsset={CrossChainSwapIllustrationSrc}
        onClick={openCryptoExchangeModal}
      />

      <BuyModals
        cryptoExchangeModalOpened={cryptoExchangeModalOpened}
        debitCreditCardModalOpened={debitCreditCardModalOpened}
        closeCryptoExchangeModal={closeCryptoExchangeModal}
        closeDebitCreditCardModal={closeDebitCreditCardModal}
      />
    </>
  );
});

const TokensTabBaseContentWrapper: FC<PropsWithChildren<{ manageActive?: boolean; padding?: boolean }>> = ({
  manageActive,
  padding,
  children
}) => (
  <ContentContainer padding={padding}>
    {manageActive ? null : <UpdateAppBanner />}

    {children}
  </ContentContainer>
);
