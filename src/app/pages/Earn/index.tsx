import React, { FC, memo, useMemo, useState } from 'react';

import PageLayout from 'app/layouts/PageLayout';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { SearchBarField } from 'app/templates/SearchField';
import { T, t, TID } from 'lib/i18n';

import { EarnItem } from './components/EarnItem';
import { EARN_OFFERS, ETH_SAVING_OFFER, TEZ_SAVING_OFFER } from './config';
import { EARN_PAGE_NAME } from './constants';

export const Earn = memo(() => {
  const [searchValue, setSearchValue] = useState('');

  const filteredOffers = useMemo(() => {
    if (!searchValue.trim()) return EARN_OFFERS;

    const query = searchValue.toLowerCase();
    return EARN_OFFERS.filter(
      offer => offer.name.toLowerCase().includes(query) || offer.description.toLowerCase().includes(query)
    );
  }, [searchValue]);

  return (
    <PageLayout pageTitle={t('earn')} contentClassName="!pb-8">
      <div className="mb-4">
        <SearchBarField value={searchValue} onValueChange={setSearchValue} defaultRightMargin={false} />
      </div>

      <div className="mb-6">
        <Title i18nKey="savings" />

        <div className="flex flex-col gap-2">
          <EarnItem offer={TEZ_SAVING_OFFER} />

          <PartnersPromotion
            id="promo-earn-item"
            key="promo-earn-item"
            variant={PartnersPromotionVariant.Text}
            pageName={EARN_PAGE_NAME}
          />

          <EarnItem offer={ETH_SAVING_OFFER} />
        </div>
      </div>

      <div>
        <Title i18nKey="externalOffers" />

        <div className="flex flex-col gap-y-2">
          {filteredOffers.map(offer => (
            <EarnItem key={offer.id} offer={offer} />
          ))}
        </div>
      </div>
    </PageLayout>
  );
});

const Title: FC<{ i18nKey: TID }> = ({ i18nKey }) => (
  <h2 className="text-font-description-bold py-1 mb-1">
    <T id={i18nKey} />
  </h2>
);
