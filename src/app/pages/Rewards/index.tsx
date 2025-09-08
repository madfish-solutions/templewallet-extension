import React, { memo, useEffect } from 'react';

import { capitalize } from 'lodash';

import { PageTitle } from 'app/atoms';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { acknowledgeRewardsBadge } from 'app/hooks/use-rewards-badge';
import PageLayout from 'app/layouts/PageLayout';
import { ReferralsCard } from 'app/pages/Rewards/referrals-card';
import { YourRewardsCards } from 'app/pages/Rewards/your-rewards-cards';
import { t } from 'lib/i18n';
import { useAccountAddressForTezos } from 'temple/front';

export const RewardsPage = memo(() => {
  const accountPkh = useAccountAddressForTezos();
  if (!accountPkh) throw new DeadEndBoundaryError();

  useEffect(() => {
    void acknowledgeRewardsBadge();
  }, []);

  return (
    <PageLayout pageTitle={<PageTitle title={capitalize(t('rewards'))} />}>
      <div className="pt-2 pb-6">
        <div className="w-full max-w-sm mx-auto flex flex-col gap-8">
          <ReferralsCard />
          <YourRewardsCards />
        </div>
      </div>
    </PageLayout>
  );
});
