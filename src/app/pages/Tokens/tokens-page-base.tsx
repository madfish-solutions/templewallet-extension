import { FC } from 'react';

import { noop } from 'lodash';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { AddCustomTokenButton } from 'app/atoms/AddCustomTokenButton';
import { PageLoader } from 'app/atoms/Loader';
import {
  VisibilityTrackingInfiniteScroll,
  VisibilityTrackingInfiniteScrollProps
} from 'app/atoms/visibility-tracking-infinite-scroll';
import { useTokensSelectedChainsState } from 'app/hooks/use-assets-view-state';
import BuyWithFiatImageSrc from 'app/misc/deposit/buy-with-fiat.png';
import CrossChainSwapImageSrc from 'app/misc/deposit/cross-chain-swap.png';
import { dispatch } from 'app/store';
import {
  useIsAccountInitializedLoadingSelector,
  useIsAccountInitializedSelector
} from 'app/store/accounts-initialization/selectors';
import { setTokensHideSmallBalanceFilterOption } from 'app/store/assets-filter-options/actions';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { AddTokenModal } from 'app/templates/add-token-modal';
import { AssetsEmptySection } from 'app/templates/assets-empty-section';
import { DepositOption } from 'app/templates/deposit-option';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { useAdsConstantsModule } from 'lib/ads-constants';
import { t, T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { OneOfChains } from 'temple/front';

import { NetworkChips } from './network-chips';
import { TokensPageSelectors } from './selectors';

export interface TokensPageBaseProps {
  applicableNetworks: OneOfChains[];
  tokensCount: number;
  getElementIndex: VisibilityTrackingInfiniteScrollProps['getElementsIndexes'];
  loadNextPage: EmptyFn;
  isSyncing: boolean;
  accountId: string;
  isInSearchMode: boolean;
  manageActive: boolean;
  network?: OneOfChains;
  shouldShowHiddenTokensHint?: boolean;
  children: ReactChildren;
}

export const TokensPageBase: FC<TokensPageBaseProps> = ({
  applicableNetworks,
  tokensCount,
  getElementIndex,
  loadNextPage,
  isSyncing,
  accountId,
  isInSearchMode,
  manageActive,
  network,
  shouldShowHiddenTokensHint,
  children
}) => {
  const isTestnet = useTestnetModeEnabledSelector();
  const accountIsInitialized = useIsAccountInitializedSelector(accountId);
  const isSyncingInitializedState = useIsAccountInitializedLoadingSelector(accountId);
  const { chainIsGloballySelected } = useTokensSelectedChainsState();
  const AdsConstantsModule = useAdsConstantsModule();
  const PartnersPromotionModule = usePartnersPromotionModule();
  const [customTokenModalOpened, openCustomTokenModal, closeCustomTokenModal] = useBooleanState(false);

  let content: ReactChildren;
  if (accountIsInitialized === false && !isSyncingInitializedState && !isTestnet && !manageActive) {
    content = (
      <UninitializedAccountContent>
        {tokensCount > 0 ? (
          <VisibilityTrackingInfiniteScroll getElementsIndexes={getElementIndex} loadNext={noop}>
            {children}
          </VisibilityTrackingInfiniteScroll>
        ) : (
          <LocalEmptyAssetsSection
            isInSearchMode={isInSearchMode}
            shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
            openCustomTokenModal={openCustomTokenModal}
          />
        )}
      </UninitializedAccountContent>
    );
  } else if (
    (accountIsInitialized !== true && isSyncingInitializedState && !isTestnet) ||
    (tokensCount === 0 && isSyncing && !isInSearchMode && !shouldShowHiddenTokensHint)
  ) {
    content = (
      <>
        <PageLoader
          className={AdsConstantsModule && PartnersPromotionModule ? 'mb-8' : undefined}
          stretch
          text={t('assetsLoaderText')}
        />

        {AdsConstantsModule && PartnersPromotionModule && (
          <PartnersPromotionModule.PartnersPromotion
            variant={PartnersPromotionModule.PartnersPromotionVariant.Text}
            id="tokens-loading-view"
            pageName={AdsConstantsModule.TOKENS_PAGE_NAME}
          />
        )}
      </>
    );
  } else if (tokensCount === 0) {
    content = (
      <LocalEmptyAssetsSection
        isInSearchMode={isInSearchMode}
        shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
        openCustomTokenModal={openCustomTokenModal}
      />
    );
  } else {
    content = (
      <>
        {manageActive && (
          <AddCustomTokenButton manageActive={manageActive} className="mb-4" onClick={openCustomTokenModal} />
        )}
        <VisibilityTrackingInfiniteScroll getElementsIndexes={getElementIndex} loadNext={loadNextPage}>
          {children}
        </VisibilityTrackingInfiniteScroll>
      </>
    );
  }

  return (
    <>
      <FadeTransition trigger={manageActive}>
        {!manageActive && !chainIsGloballySelected && accountIsInitialized && (
          <div className="mb-1">
            <NetworkChips applicableNetworks={applicableNetworks} />
          </div>
        )}

        {content}
      </FadeTransition>

      <AddTokenModal
        forCollectible={false}
        opened={customTokenModalOpened}
        onRequestClose={closeCustomTokenModal}
        initialNetwork={network}
      />
    </>
  );
};

interface LocalEmptyAssetsSectionProps extends Pick<
  TokensPageBaseProps,
  'isInSearchMode' | 'shouldShowHiddenTokensHint'
> {
  openCustomTokenModal: EmptyFn;
}

const LocalEmptyAssetsSection = ({
  isInSearchMode,
  shouldShowHiddenTokensHint = false,
  openCustomTokenModal
}: LocalEmptyAssetsSectionProps) => (
  <AssetsEmptySection
    forCollectibles={false}
    forSearch={isInSearchMode || shouldShowHiddenTokensHint}
    // Intentionally forcing the same look for both variants
    manageActive={false}
    textI18n={shouldShowHiddenTokensHint ? 'shortHiddenTokensHint' : undefined}
    stretchSpaceBeforeButton={false}
    action={shouldShowHiddenTokensHint ? 'displayAllTokens' : 'addCustomToken'}
    onAddCustomTokenClick={openCustomTokenModal}
    onDisplayAllTokensClick={() => dispatch(setTokensHideSmallBalanceFilterOption(false))}
  />
);

const UninitializedAccountContent: FC<PropsWithChildren> = ({ children }) => (
  <>
    <p className="p-1 mb-1 text-font-description-bold text-grey-1">
      <T id="makeTheFirstDepositToGetStarted" />
    </p>

    <DepositOption
      paymentIcons
      to="/buy/card"
      title={t('buyWithFiat')}
      description={t('buyWithFiatDescription')}
      testID={TokensPageSelectors.buyWithFiatButton}
      imageSrc={BuyWithFiatImageSrc}
      className="mb-2"
    />

    <DepositOption
      to="/buy/crypto"
      title={t('depositWithCrypto')}
      description={t('depositWithCryptoDescription')}
      testID={TokensPageSelectors.crossChainSwapButton}
      imageSrc={CrossChainSwapImageSrc}
      className="mb-4"
    />

    <p className="p-1 mb-1 text-font-description-bold text-grey-1">
      <T id="whitelistedTokens" />
    </p>

    {children}
  </>
);
