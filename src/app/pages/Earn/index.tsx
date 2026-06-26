import { FC, ReactNode, useState } from 'react';

import { IconBase } from 'app/atoms';
import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButtonAnchor,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { EmptyState } from 'app/atoms/EmptyState';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import PageLayout from 'app/layouts/PageLayout';
import { EarnDepositStats } from 'app/templates/EarnDepositStats';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { SearchBarField } from 'app/templates/SearchField';
import { useAdsConstantsModule } from 'lib/ads-constants';
import { DAppForDeposit } from 'lib/dapps-for-deposit';
import { T, t, TID } from 'lib/i18n';

import { DAppForDepositItem } from './components/DAppForDepositItem';
import { EarnItem } from './components/EarnItem';
import { EthSavingItem } from './components/EthSavingItem';
import { TezSavingItem } from './components/TezSavingItem';
import { ETH_SAVING_OFFER_ID, TEZ_SAVING_OFFER_ID } from './config';
import { useFilteredEarnOffers } from './hooks/use-filtered-earn-offers';
import { EarnSelectors } from './selectors';
import { EarnOffer } from './types';

export const Earn: FC = () => {
  const { searchValue, setSearchValue, savingsOffers, externalOffers, dAppsForDeposits } = useFilteredEarnOffers();
  const PartnersPromotionModule = usePartnersPromotionModule();
  const [dAppForDeposit, setDAppForDeposit] = useState<DAppForDeposit | null>(null);
  const AdsConstantsModule = useAdsConstantsModule();

  const getItems =
    // oxlint-disable-next-line typescript/no-unnecessary-type-constraint
    <T extends unknown>(
      data: T[],
      renderItem: (item: T) => ReactNode,
      shouldHidePromo: boolean,
      PromoWrapper?: FC<PropsWithChildren>
    ) => {
      const items = data.map(renderItem);

      if (!items.length || shouldHidePromo) return items;

      return withPromo(items, PartnersPromotionModule, AdsConstantsModule, PromoWrapper);
    };

  const savingsItems = getItems(savingsOffers, toRenderItem, false);
  const savingsAvailable = savingsItems.length > 0;
  const externalItems = getItems(externalOffers, toRenderItem, savingsAvailable);
  const externalOffersAvailable = externalItems.length > 0;

  const dAppsForDepositsItems = getItems(
    dAppsForDeposits,
    dApp => <DAppForDepositItem key={dApp.id} dApp={dApp} onClick={setDAppForDeposit} />,
    savingsAvailable || externalOffersAvailable,
    DAppsForDepositsPromoWrapper
  );
  const dAppsForDepositsAvailable = dAppsForDeposits.length > 0;

  const handleCloseDAppForDepositModal = () => setDAppForDeposit(null);
  const shouldShowEmptyState = !savingsAvailable && !externalOffersAvailable && !dAppsForDepositsAvailable;

  return (
    <PageLayout pageTitle={t('earn')} bgWhite={false} contentClassName="pb-8!">
      <div className="mb-4">
        <SearchBarField value={searchValue} onValueChange={setSearchValue} defaultRightMargin={false} />
      </div>

      {dAppsForDepositsAvailable && (
        <div className="mb-4">
          <Title i18nKey="depositToDApps" />

          <div className="grid grid-cols-2 gap-2">{dAppsForDepositsItems}</div>
        </div>
      )}

      {savingsAvailable && (
        <div className="mb-4">
          <Title i18nKey="savings" />

          <div className="flex flex-col gap-y-2">
            <EarnDepositStats />
            {savingsItems}
          </div>
        </div>
      )}

      {externalOffersAvailable && (
        <div>
          <Title i18nKey="externalOffers" />

          <div className="flex flex-col gap-y-2">{externalItems}</div>
        </div>
      )}

      {shouldShowEmptyState && <EmptyState stretch />}

      {dAppForDeposit && (
        <ActionModal
          onClose={handleCloseDAppForDepositModal}
          closeButtonTestID={EarnSelectors.dAppForDepositCloseButton}
          title={t('depositToDApp', dAppForDeposit.name)}
        >
          <ActionModalBodyContainer className="pt-3">
            <p className="text-font-description text-grey-1 text-center my-1">
              <T id="depositToDAppNotAvailable" />
            </p>
          </ActionModalBodyContainer>

          <ActionModalButtonsContainer className="pb-4">
            <ActionModalButtonAnchor
              className="flex justify-center items-center gap-0.5"
              color="secondary-low"
              testID={EarnSelectors.dAppExternalLinkButton}
              href={dAppForDeposit.link}
              onClick={handleCloseDAppForDepositModal}
              testIDProperties={{ dAppName: dAppForDeposit.name }}
            >
              <T id="goToDApp" substitutions={dAppForDeposit.name} />
              <IconBase Icon={OutLinkIcon} size={16} className="text-secondary" />
            </ActionModalButtonAnchor>
          </ActionModalButtonsContainer>
        </ActionModal>
      )}
    </PageLayout>
  );
};

const toRenderItem = (offer: EarnOffer) => {
  switch (offer.id) {
    case TEZ_SAVING_OFFER_ID:
      return <TezSavingItem key={offer.id} />;
    case ETH_SAVING_OFFER_ID:
      return <EthSavingItem key={offer.id} />;
    default:
      return <EarnItem key={offer.id} offer={offer} />;
  }
};

const Title: FC<{ i18nKey: TID }> = ({ i18nKey }) => (
  <h2 className="text-font-description-bold py-1 mb-1">
    <T id={i18nKey} />
  </h2>
);

const DAppsForDepositsPromoWrapper: FC<PropsWithChildren> = ({ children }) => (
  <div className="col-span-2">{children}</div>
);

const withPromo = (
  items: ReactNode[],
  PartnersPromotionModule: ReturnType<typeof usePartnersPromotionModule>,
  AdsConstantsModule: ReturnType<typeof useAdsConstantsModule>,
  PromoWrapper?: FC<PropsWithChildren>
) => {
  if (!PartnersPromotionModule || !AdsConstantsModule) return items;

  const { PartnersPromotion, PartnersPromotionVariant } = PartnersPromotionModule;

  const promoJsx = (
    <PartnersPromotion
      id="promo-earn-item"
      key="promo-earn-item"
      variant={PartnersPromotionVariant.Text}
      pageName={AdsConstantsModule.EARN_PAGE_NAME}
    />
  );
  const promoJsxWithWrapper = PromoWrapper ? <PromoWrapper>{promoJsx}</PromoWrapper> : promoJsx;

  if (items.length < 2) {
    items.push(promoJsxWithWrapper);
  } else {
    items.splice(1, 0, promoJsxWithWrapper);
  }

  return items;
};
