import { FC } from 'react';

import { noop } from 'lodash';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { IconBase, ToggleSwitch } from 'app/atoms';
import { AddCustomTokenButton } from 'app/atoms/AddCustomTokenButton';
import { IconButton } from 'app/atoms/IconButton';
import { PageLoader } from 'app/atoms/Loader';
import { MiniPageModal } from 'app/atoms/PageModal/mini-page-modal';
import { SettingsCellSingle } from 'app/atoms/SettingsCell';
import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';
import {
  VisibilityTrackingInfiniteScroll,
  VisibilityTrackingInfiniteScrollProps
} from 'app/atoms/visibility-tracking-infinite-scroll';
import { useTokensSearchState, useTokensSelectedChainsState } from 'app/hooks/use-assets-view-state';
import { ReactComponent as FilterOffIcon } from 'app/icons/base/filteroff.svg';
import { ReactComponent as FilterOnIcon } from 'app/icons/base/filteron.svg';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ReactComponent as CloseIcon } from 'app/icons/base/x.svg';
import PageLayout from 'app/layouts/PageLayout';
import BuyWithFiatImageSrc from 'app/misc/deposit/buy-with-fiat.png';
import CrossChainSwapImageSrc from 'app/misc/deposit/cross-chain-swap.png';
import { dispatch } from 'app/store';
import {
  useIsAccountInitializedLoadingSelector,
  useIsAccountInitializedSelector
} from 'app/store/accounts-initialization/selectors';
import {
  setTokensGroupByNetworkFilterOption,
  setTokensHideSmallBalanceFilterOption
} from 'app/store/assets-filter-options/actions';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { AddTokenModal } from 'app/templates/add-token-modal';
import { AssetsEmptySection } from 'app/templates/assets-empty-section';
import { DepositOption } from 'app/templates/deposit-option';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { SearchBarField } from 'app/templates/SearchField';
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
  toggleManageActive: EmptyFn;
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
  toggleManageActive,
  network,
  shouldShowHiddenTokensHint,
  children
}) => {
  const isTestnet = useTestnetModeEnabledSelector();
  const accountIsInitialized = useIsAccountInitializedSelector(accountId);
  const isSyncingInitializedState = useIsAccountInitializedLoadingSelector(accountId);
  const { searchValue, setSearchValue } = useTokensSearchState();
  const { tokensListOptions } = useAssetsFilterOptionsSelector();
  const { chainIsGloballySelected } = useTokensSelectedChainsState();
  const [filtersModalOpen, openFiltersModal, closeFiltersModal] = useBooleanState(false);
  const { hideSmallBalance, groupByNetwork } = tokensListOptions;
  const AdsConstantsModule = useAdsConstantsModule();
  const PartnersPromotionModule = usePartnersPromotionModule();
  const [customTokenModalOpened, openCustomTokenModal, closeCustomTokenModal] = useBooleanState(false);

  const LocalEmptyAssetsSection = () => (
    <AssetsEmptySection
      forCollectibles={false}
      forSearch={isInSearchMode}
      manageActive={manageActive}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      stretchSpaceBeforeButton={false}
      onAddCustomTokenClick={openCustomTokenModal}
    />
  );

  let content: ReactChildren;
  if (accountIsInitialized === false && !isSyncingInitializedState && !isTestnet && !manageActive) {
    content = (
      <UninitializedAccountContent>
        {tokensCount > 0 ? (
          <VisibilityTrackingInfiniteScroll getElementsIndexes={getElementIndex} loadNext={noop}>
            {children}
          </VisibilityTrackingInfiniteScroll>
        ) : (
          <LocalEmptyAssetsSection />
        )}
      </UninitializedAccountContent>
    );
  } else if (
    (accountIsInitialized !== true && isSyncingInitializedState && !isTestnet) ||
    (tokensCount === 0 && isSyncing && !isInSearchMode)
  ) {
    content = (
      <>
        <PageLoader
          className={AdsConstantsModule && PartnersPromotionModule ? 'mb-8' : undefined}
          stretch
          text={t('assetsLoaderText')}
        />

        {AdsConstantsModule && PartnersPromotionModule && (
          <div className="-mb-7">
            <PartnersPromotionModule.PartnersPromotion
              variant={PartnersPromotionModule.PartnersPromotionVariant.Text}
              id="tokens-loading-view"
              pageName={AdsConstantsModule.TOKENS_PAGE_NAME}
            />
          </div>
        )}
      </>
    );
  } else if (tokensCount === 0) {
    content = <LocalEmptyAssetsSection />;
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
    <PageLayout
      pageTitle={<T id="tokens" />}
      contentPadding={false}
      contentClassName="px-4 pb-8"
      headerRightElem={
        <IconBase
          Icon={hideSmallBalance || groupByNetwork ? FilterOnIcon : FilterOffIcon}
          className="text-primary cursor-pointer"
          onClick={openFiltersModal}
        />
      }
      headerChildren={
        <div className="flex p-4 gap-2 bg-background items-center">
          <SearchBarField
            value={searchValue}
            placeholder={t('search')}
            onValueChange={setSearchValue}
            testID={TokensPageSelectors.searchField}
          />

          <IconButton Icon={manageActive ? CloseIcon : ManageIcon} color="blue" onClick={toggleManageActive} />
        </div>
      }
    >
      <FadeTransition trigger={manageActive}>
        {!manageActive && !chainIsGloballySelected && accountIsInitialized && (
          <div className="mb-1">
            <NetworkChips applicableNetworks={applicableNetworks} />
          </div>
        )}

        {content}
      </FadeTransition>

      <MiniPageModal opened={filtersModalOpen} onRequestClose={closeFiltersModal} title={t('filters')}>
        <SettingsCellGroup className="m-4 mb-8">
          <SettingsCellSingle Component="div" cellName={t('hideSmallBalance')} isLast={false}>
            <ToggleSwitch
              checked={hideSmallBalance}
              disabled={isTestnet}
              onChange={value => dispatch(setTokensHideSmallBalanceFilterOption(value))}
              testID={TokensPageSelectors.hideSmallBalanceToggle}
            />
          </SettingsCellSingle>

          <SettingsCellSingle Component="div" cellName={t('groupByNetwork')}>
            <ToggleSwitch
              checked={groupByNetwork}
              disabled={chainIsGloballySelected}
              onChange={value => dispatch(setTokensGroupByNetworkFilterOption(value))}
              testID={TokensPageSelectors.groupByNetworkToggle}
            />
          </SettingsCellSingle>
        </SettingsCellGroup>
      </MiniPageModal>

      <AddTokenModal
        forCollectible={false}
        opened={customTokenModalOpened}
        onRequestClose={closeCustomTokenModal}
        initialNetwork={network}
      />
    </PageLayout>
  );
};

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
      title={t('crossChainSwap')}
      description={t('crossChainSwapDescription')}
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
