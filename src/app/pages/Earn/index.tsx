import { FC, memo, ReactNode, useMemo } from 'react';

import { EmptyState } from 'app/atoms/EmptyState';
import PageLayout from 'app/layouts/PageLayout';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { SearchBarField } from 'app/templates/SearchField';
import { T, t, TID } from 'lib/i18n';

import { EarnItem } from './components/EarnItem';
import { EthSavingItem } from './components/EthSavingItem';
import { TezSavingItem } from './components/TezSavingItem';
import { ETH_SAVING_OFFER_ID, TEZ_SAVING_OFFER_ID } from './config';
import { EARN_PAGE_NAME } from './constants';
import { useFilteredEarnOffers } from './hooks/use-filtered-earn-offers';
import { EarnOffer } from './types';

export const Earn = memo(() => {
  const { searchValue, setSearchValue, savingsOffers, externalOffers } = useFilteredEarnOffers();
  const PartnersPromotionModule = usePartnersPromotionModule();

  const savingsItems = useMemo(() => {
    const items = savingsOffers.map(toRenderItem);

    return items.length ? withPromo(items, PartnersPromotionModule) : items;
  }, [savingsOffers, PartnersPromotionModule]);

  const savingsAvailable = useMemo(() => savingsItems.length > 0, [savingsItems.length]);

  const externalItems = useMemo(() => {
    const items = externalOffers.map(toRenderItem);

    if (!items.length || savingsAvailable) return items;

    return withPromo(items, PartnersPromotionModule);
  }, [externalOffers, savingsAvailable, PartnersPromotionModule]);

  const externalOffersAvailable = externalItems.length > 0;
  const shouldShowEmptyState = !savingsAvailable && !externalOffersAvailable;

  return (
    <PageLayout pageTitle={t('earn')} bgWhite={false} contentClassName="pb-8!">
      <div className="mb-4">
        <SearchBarField value={searchValue} onValueChange={setSearchValue} defaultRightMargin={false} />
      </div>

      {savingsAvailable && (
        <div className="mb-4">
          <Title i18nKey="savings" />

          <div className="flex flex-col gap-y-2">{savingsItems}</div>
        </div>
      )}

      {externalOffersAvailable && (
        <div>
          <Title i18nKey="externalOffers" />

          <div className="flex flex-col gap-y-2">{externalItems}</div>
        </div>
      )}

      {shouldShowEmptyState && <EmptyState stretch />}
    </PageLayout>
  );
});

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

const withPromo = (items: ReactNode[], PartnersPromotionModule: ReturnType<typeof usePartnersPromotionModule>) => {
  if (!PartnersPromotionModule) return items;

  const { PartnersPromotion, PartnersPromotionVariant } = PartnersPromotionModule;

  const promoJsx = (
    <PartnersPromotion
      id="promo-earn-item"
      key="promo-earn-item"
      variant={PartnersPromotionVariant.Text}
      pageName={EARN_PAGE_NAME}
    />
  );

  if (items.length < 2) {
    items.push(promoJsx);
  } else {
    items.splice(1, 0, promoJsx);
  }

  return items;
};
