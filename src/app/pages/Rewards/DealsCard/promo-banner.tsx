import { FC } from 'react';

import { Button } from 'app/atoms';
import { t } from 'lib/i18n';
import { navigate } from 'lib/woozie';

import merchantsStackImage from './assets/merchant-stack.png';
import { DealsCardSelectors } from './selectors';

export const DealsPromoBanner: FC = () => (
  <Button
    testID={DealsCardSelectors.promoBanner}
    onClick={() => navigate('/rewards/deals/activate')}
    className="w-full rounded-8 bg-primary hover:bg-primary-hover transition-colors text-white p-4 pr-3 text-left flex items-start gap-4 overflow-clip"
  >
    <div className="flex-1 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-font-medium-bold">{t('templeDeals')}</p>
        <p className="text-font-description">{t('templeDealsDescription')}</p>
      </div>
      <span className="self-start px-2 py-1 rounded-6 bg-white text-secondary text-font-small-bold">
        {t('partnersCountBadge')}
      </span>
    </div>
    <img src={merchantsStackImage} alt="" className="self-center w-33.5 h-18.25 object-contain" />
  </Button>
);
