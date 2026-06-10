import { FC } from 'react';

import { t } from 'lib/i18n';
import { useAccountForTezos } from 'temple/front';

import { BakeryCard } from './BakeryCard';
import { DealsCard } from './DealsCard';
import { PromoCard } from './PromoCard';

export const YourRewardsSection: FC = () => {
  const hasTezosAccount = Boolean(useAccountForTezos());

  return (
    <div className="flex flex-col">
      <span className="text-font-medium-bold py-2">{t('yourRewards')}</span>

      <DealsCard />

      <div className="grid grid-cols-2 gap-2 mt-2">
        <PromoCard />
        {hasTezosAccount && <BakeryCard />}
      </div>
    </div>
  );
};
