import { FC, useContext, useState } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { SyncSpinner } from 'app/atoms';
import { AddCustomTokenButton } from 'app/atoms/AddCustomTokenButton';
import { PageLoader } from 'app/atoms/Loader';
import { StyledButton } from 'app/atoms/StyledButton';
import { TotalEquity } from 'app/atoms/TotalEquity';
import { ContentContainer } from 'app/layouts/containers';
import BuyWithFiatImageSrc from 'app/misc/deposit/buy-with-fiat.png';
import CrossChainSwapImageSrc from 'app/misc/deposit/cross-chain-swap.png';
import { HomeSelectors } from 'app/pages/Home/selectors';
import { dispatch } from 'app/store';
import {
  useIsAccountInitializedLoadingSelector,
  useIsAccountInitializedSelector
} from 'app/store/accounts-initialization/selectors';
import { setTokensHideSmallBalanceFilterOption } from 'app/store/assets-filter-options/actions';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { AddTokenModal } from 'app/templates/add-token-modal';
import { CardWithChevron } from 'app/templates/card-with-chevron';
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
import { EMPTY_FROZEN_ARRAY } from 'lib/utils';
import { navigate } from 'lib/woozie';
import { OneOfChains } from 'temple/front';

import { ContentBodyBaseContext } from './content-body-base-context';

export interface ContentBodyBaseProps {
  tokensCount: number;
  isSyncingTokens: boolean;
  accountId: string;
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
  shouldShowHiddenTokensHint,
  children,
  openCustomAssetModal,
  tezosCollectibles = EMPTY_FROZEN_ARRAY,
  evmCollectibles = EMPTY_FROZEN_ARRAY,
  collectiblesReady,
  collectiblesSortPredicate
}) => {
  const isTestnet = useTestnetModeEnabledSelector();
  const accountIsInitialized = useIsAccountInitializedSelector(accountId);
  const isSyncingInitializedState = useIsAccountInitializedLoadingSelector(accountId);

  const showSmallBalancesTokens = () => dispatch(setTokensHideSmallBalanceFilterOption(false));

  const someAssetsPresent = tokensCount > 0 || tezosCollectibles.length > 0 || evmCollectibles.length > 0;

  if (accountIsInitialized === false && !isSyncingInitializedState && !isTestnet) {
    return (
      <ContentBodyBaseInternalWrapper className="pt-0!">
        <TokensSection>
          <DepositOptions />
        </TokensSection>

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
    (!someAssetsPresent && isSyncingTokens)
  ) {
    return (
      <ContentBodyBaseInternalWrapper padding={false}>
        <PageLoader stretch />
      </ContentBodyBaseInternalWrapper>
    );
  }

  return (
    <ContentBodyBaseInternalWrapper>
      <TokensSection>
        {tokensCount > 0 && children}
        {tokensCount === 0 && shouldShowHiddenTokensHint && (
          <div className="flex flex-col items-center px-2 py-3 gap-3">
            <p className="text-font-description-bold text-grey-1 text-center">
              <T id="shortHiddenTokensHint" />
            </p>
            <StyledButton color="secondary-low" size="S" onClick={showSmallBalancesTokens}>
              <T id="displayAllTokens" />
            </StyledButton>
          </div>
        )}
        {tokensCount === 0 && !shouldShowHiddenTokensHint && <DepositOptions />}
      </TokensSection>

      <NftsSection
        tezosCollectibles={tezosCollectibles}
        evmCollectibles={evmCollectibles}
        collectiblesReady={collectiblesReady}
        collectiblesSortPredicate={collectiblesSortPredicate}
        openCustomAssetModal={openCustomAssetModal}
      />
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
  const collectiblesSlugsSorted = tezosCollectiblesSlugs.concat(evmCollectiblesSlugs).sort(collectiblesSortPredicate);
  const collectibles = tezosCollectibles.concat(evmCollectibles);

  return (
    <CardWithChevron
      title={
        <span className="text-font-description-bold">
          <T id="nfts" />
        </span>
      }
      linkTo="/nfts"
      testID={HomeSelectors.nftsSection}
      className="mt-6"
    >
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
    </CardWithChevron>
  );
};

const TokensSection = ({ children }: PropsWithChildren) => {
  const { onCryptoCardClick, account, filterChain } = useContext(ContentBodyBaseContext);
  return (
    <div className="flex flex-col relative mb-17 -mx-4">
      <KoloCryptoCardPreview onClick={onCryptoCardClick} />

      <CardWithChevron
        title={
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
        }
        linkTo="/tokens"
        className="relative -mb-17 transform transition-transform duration-200 ease-out peer-hover:translate-y-2 mx-4"
        testID={HomeSelectors.tokensSection}
      >
        {children}
      </CardWithChevron>
    </div>
  );
};

const DepositOptions = () => (
  <div className="flex flex-col gap-2 p-2">
    <DepositOption
      paymentIcons
      to="/buy/card"
      title={t('buyWithFiat')}
      description={t('buyWithFiatDescription')}
      testID={HomeSelectors.buyWithFiatButton}
      imageSrc={BuyWithFiatImageSrc}
    />

    <DepositOption
      to="/buy/crypto"
      title={t('depositWithCrypto')}
      description={t('depositWithCryptoDescription')}
      testID={HomeSelectors.crossChainSwapButton}
      imageSrc={CrossChainSwapImageSrc}
    />
  </div>
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
