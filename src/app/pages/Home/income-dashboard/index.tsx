import clsx from 'clsx';

import { DISABLE_ADS } from 'lib/env';

import { EarnCard } from './earn-card';
import { RewardsCard } from './rewards-card';

export const IncomeDashboard = () => (
  <div className={clsx('grid gap-2 px-4 mb-3', DISABLE_ADS ? 'grid-cols-1' : 'grid-cols-2')}>
    <EarnCard />

    {!DISABLE_ADS && <RewardsCard />}
  </div>
);
