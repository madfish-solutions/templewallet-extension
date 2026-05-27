import { FC, useContext, useState } from 'react';

import clsx from 'clsx';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { SyncSpinner } from 'app/atoms';
import { AddCustomTokenButton } from 'app/atoms/AddCustomTokenButton';
import { AnimatedMenuChevron } from 'app/atoms/animated-menu-chevron';
import { PageLoader } from 'app/atoms/Loader';
import { TotalEquity } from 'app/atoms/TotalEquity';
import { ContentContainer } from 'app/layouts/containers';
import BuyWithFiatImageSrc from 'app/misc/deposit/buy-with-fiat.png';
import CrossChainSwapImageSrc from 'app/misc/deposit/cross-chain-swap.png';
import { HomeSelectors } from 'app/pages/Home/selectors';
import {
  useIsAccountInitializedLoadingSelector,
  useIsAccountInitializedSelector
} from 'app/store/accounts-initialization/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { AddTokenModal } from 'app/templates/add-token-modal';
import { AssetsEmptySection } from 'app/templates/assets-empty-section';
import { CollectiblesGroupGrid } from 'app/templates/collectibles/collectibles-group-grid';
import { DAppConnection } from 'app/templates/DAppConnection';
import { DepositOption } from 'app/templates/deposit-option';
import { KoloCryptoCardPreview } from 'app/templates/KoloCard/KoloCryptoCardPreview';
import {
  AccountCollectible,
  toEvmEnabledCollectiblesChainSlugs,
  toTezEnabledCollectiblesChainSlugs
} from 'lib/assets/hooks/collectibles';
import { t, T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { useActivateAnimatedChevron } from 'lib/ui/hooks/use-activate-animated-chevron';
import { EMPTY_FROZEN_ARRAY } from 'lib/utils';
import { Link, navigate } from 'lib/woozie';
import { OneOfChains } from 'temple/front';

import { ContentBodyBaseContext } from './content-body-base-context';

export interface ContentBodyBaseProps {
  tokensCount: number;
  isSyncingTokens: boolean;
  accountId: string;
  isInSearchMode: boolean;
  network?: OneOfChains;
  shouldShowHiddenTokensHint?: boolean;
  tezosCollectibles?: AccountCollectible[];
  evmCollectibles?: AccountCollectible[];
  collectiblesReady: boolean;
  collectiblesSortPredicate: (aChainAssetSlug: string, bChainAssetSlug: string) => number;
}

const goToNftsPage = () => navigate('/nfts');

export const ContentBodyBase: FC<PropsWithChildren<ContentBodyBaseProps>> = props => {
  const [customAssetModalOpened, localOpenCustomAssetModal, closeCustomAssetModal] = useBooleanState(false);
  const [forCollectible, setForCollectible] = useState(false);

  const openCustomAssetModal = (forCollectible: boolean) => {
    setForCollectible(forCollectible);
    localOpenCustomAssetModal();
  };

  return (
    <>
      <FadeTransition>
        <ContentBodyBaseInternal {...props} openCustomAssetModal={openCustomAssetModal} />
      </FadeTransition>

      <AddTokenModal
        forCollectible={forCollectible}
        opened={customAssetModalOpened}
        onRequestClose={closeCustomAssetModal}
        initialNetwork={props.network}
      />

      <DAppConnection />
    </>
  );
};

const ContentBodyBaseInternal: FC<
  PropsWithChildren<Omit<ContentBodyBaseProps, 'network'> & { openCustomAssetModal: SyncFn<boolean> }>
> = ({
  tokensCount,
  isSyncingTokens,
  accountId,
  isInSearchMode,
  shouldShowHiddenTokensHint,
  children,
  openCustomAssetModal,
  tezosCollectibles,
  evmCollectibles,
  collectiblesReady,
  collectiblesSortPredicate
}) => {
  const { onCryptoCardClick, account, filterChain } = useContext(ContentBodyBaseContext);
  const isTestnet = useTestnetModeEnabledSelector();
  const accountIsInitialized = useIsAccountInitializedSelector(accountId);
  const isSyncingInitializedState = useIsAccountInitializedLoadingSelector(accountId);
  const {
    animatedChevronRef: animatedTokensChevronRef,
    handleHover: handleTokensHover,
    handleUnhover: handleTokensUnhover
  } = useActivateAnimatedChevron();

  const openCustomTokenModal = () => openCustomAssetModal(false);

  if (accountIsInitialized === false && !isSyncingInitializedState && !isTestnet) {
    return (
      <ContentBodyBaseInternalWrapper className="pt-0!">
        <UninitializedAccountContent />

        <NftsSection
          tezosCollectibles={tezosCollectibles}
          evmCollectibles={evmCollectibles}
          collectiblesReady={collectiblesReady}
          collectiblesSortPredicate={collectiblesSortPredicate}
          openCustomAssetModal={openCustomAssetModal}
        />
      </ContentBodyBaseInternalWrapper>
    );
  }

  if (
    (accountIsInitialized !== true && isSyncingInitializedState && !isTestnet) ||
    (tokensCount === 0 && isSyncingTokens && !isInSearchMode)
  ) {
    return (
      <ContentBodyBaseInternalWrapper padding={false}>
        <PageLoader stretch />
      </ContentBodyBaseInternalWrapper>
    );
  }

  return (
    <ContentBodyBaseInternalWrapper padding={tokensCount > 0}>
      {tokensCount === 0 ? (
        <AssetsEmptySection
          forCollectibles={false}
          forSearch={isInSearchMode}
          manageActive={false}
          shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
          onAddCustomTokenClick={openCustomTokenModal}
        />
      ) : (
        <>
          <div className="flex flex-col relative mb-17 -mx-4">
            <KoloCryptoCardPreview onClick={onCryptoCardClick} />

            <div
              className={clsx(
                'relative -mb-17 transform transition-transform duration-200 ease-out peer-hover:translate-y-2 mx-4',
                'bg-white rounded-8 border-0.5 border-lines p-1 pt-0 flex flex-col'
              )}
              onMouseEnter={handleTokensHover}
              onMouseLeave={handleTokensUnhover}
            >
              <Link
                to="/tokens"
                className="flex justify-between items-center p-2 gap-1"
                testID={HomeSelectors.tokensSection}
              >
                <div className="flex items-center gap-1">
                  <span className="text-font-description-bold">
                    <T id="tokens" />
                  </span>
                  <span className="text-font-num-bold-12 font-medium text-grey-1">
                    <TotalEquity
                      account={account}
                      currency="fiat"
                      tooltip={false}
                      filterChain={filterChain}
                      includeDeposits={false}
                    />
                  </span>
                </div>
                <AnimatedMenuChevron ref={animatedTokensChevronRef} />
              </Link>

              <div className="flex flex-col bg-background rounded-8">{children}</div>
            </div>
          </div>

          <NftsSection
            tezosCollectibles={tezosCollectibles}
            evmCollectibles={evmCollectibles}
            collectiblesReady={collectiblesReady}
            collectiblesSortPredicate={collectiblesSortPredicate}
            openCustomAssetModal={openCustomAssetModal}
          />
        </>
      )}
    </ContentBodyBaseInternalWrapper>
  );
};

interface NftsSectionProps extends Pick<
  ContentBodyBaseProps,
  'tezosCollectibles' | 'evmCollectibles' | 'collectiblesReady' | 'collectiblesSortPredicate'
> {
  openCustomAssetModal: SyncFn<boolean>;
}

const NftsSection = ({
  tezosCollectibles = EMPTY_FROZEN_ARRAY,
  evmCollectibles = EMPTY_FROZEN_ARRAY,
  collectiblesReady,
  collectiblesSortPredicate,
  openCustomAssetModal
}: NftsSectionProps) => {
  const openCustomCollectibleModal = () => openCustomAssetModal(true);
  const tezosCollectiblesSlugs = toTezEnabledCollectiblesChainSlugs(tezosCollectibles);
  const evmCollectiblesSlugs = toEvmEnabledCollectiblesChainSlugs(evmCollectibles);
  const {
    animatedChevronRef: animatedNftsChevronRef,
    handleHover: handleNftsHover,
    handleUnhover: handleNftsUnhover
  } = useActivateAnimatedChevron();
  const collectiblesSlugsSorted = tezosCollectiblesSlugs.concat(evmCollectiblesSlugs).sort(collectiblesSortPredicate);
  const collectibles = tezosCollectibles.concat(evmCollectibles);

  return (
    <div
      className="mt-6 bg-white rounded-8 border-0.5 border-lines p-1 pt-0 flex flex-col"
      onMouseEnter={handleNftsHover}
      onMouseLeave={handleNftsUnhover}
    >
      <Link to="/nfts" className="flex justify-between items-center p-2 gap-1" testID={HomeSelectors.nftsSection}>
        <span className="text-font-description-bold">
          <T id="nfts" />
        </span>
        <AnimatedMenuChevron ref={animatedNftsChevronRef} />
      </Link>
      {collectibles.length === 0 && collectiblesReady && (
        <div className="flex flex-col items-center px-2 py-3 gap-3 bg-background rounded-8">
          <p className="text-font-description-bold text-grey-1 text-center">
            <T id="startYourCollectionToday" />
          </p>

          <AddCustomTokenButton className="mb-0!" onClick={openCustomCollectibleModal} manageActive={false} />
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

const ContentBodyBaseInternalWrapper: FC<PropsWithChildren<{ padding?: boolean; className?: string }>> = ({
  padding,
  className,
  children
}) => (
  <ContentContainer withShadow={false} padding={padding} className={className}>
    {children}
  </ContentContainer>
);
